import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { percentChange, startOfUbDay, ubDateKey, ubParts } from "@/lib/format";

/** Тухайн өдрийн (Улаанбаатарын цагаар) борлуулалтыг дахин тооцоолж Analytics хүснэгтэд хадгална. */
export async function refreshAnalyticsDay(restaurantId: string, at: Date = new Date()): Promise<void> {
  const from = startOfUbDay(at);
  const to = startOfUbDay(at, 1);
  const [valid, cancelled, byType] = await Promise.all([
    db.order.aggregate({
      where: { restaurantId, createdAt: { gte: from, lt: to }, status: { not: "CANCELLED" } },
      _sum: { total: true },
      _count: true,
    }),
    db.order.count({ where: { restaurantId, createdAt: { gte: from, lt: to }, status: "CANCELLED" } }),
    db.order.groupBy({
      by: ["type"],
      where: { restaurantId, createdAt: { gte: from, lt: to }, status: { not: "CANCELLED" } },
      _count: true,
    }),
  ]);
  const revenue = valid._sum.total ?? 0;
  const orders = valid._count;
  const typeCount = (t: string) => byType.find((b) => b.type === t)?._count ?? 0;
  const data = {
    revenue,
    orders,
    cancelled,
    avgOrder: orders ? Math.round(revenue / orders) : 0,
    dineIn: typeCount("DINE_IN"),
    takeaway: typeCount("TAKEAWAY"),
    delivery: typeCount("DELIVERY"),
  };
  const date = ubDateKey(at);
  await db.analytics.upsert({
    where: { restaurantId_date: { restaurantId, date } },
    create: { restaurantId, date, ...data },
    update: data,
  });
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export async function getDashboardData(restaurantId: string) {
  const now = new Date();
  const todayStart = startOfUbDay(now);
  const yesterdayStart = startOfUbDay(now, -1);
  // Өчигдрийн яг энэ цаг хүртэлх борлуулалттай харьцуулна
  const yesterdaySameTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [today, yesterday, pending, activeTables, totalTables, hourly, topItem, recent] = await Promise.all([
    db.order.aggregate({
      where: { restaurantId, createdAt: { gte: todayStart }, status: { not: "CANCELLED" } },
      _sum: { total: true },
      _count: true,
    }),
    db.order.aggregate({
      where: {
        restaurantId,
        createdAt: { gte: yesterdayStart, lt: yesterdaySameTime },
        status: { not: "CANCELLED" },
      },
      _sum: { total: true },
      _count: true,
    }),
    db.order.count({ where: { restaurantId, status: { in: ["NEW", "CONFIRMED", "PREPARING"] } } }),
    db.table.count({ where: { restaurantId, status: { not: "FREE" } } }),
    db.table.count({ where: { restaurantId } }),
    hourlySales(restaurantId, yesterdayStart, startOfUbDay(now, 1)),
    db.orderItem.groupBy({
      by: ["name"],
      where: { order: { restaurantId, createdAt: { gte: todayStart }, status: { not: "CANCELLED" } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 1,
    }),
    db.order.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { table: { select: { number: true } }, _count: { select: { items: true } } },
    }),
  ]);

  const todayRevenue = today._sum.total ?? 0;
  const yesterdayRevenue = yesterday._sum.total ?? 0;
  const todayHour = ubParts(now).hour;

  const series = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    today: 0,
    yesterday: 0,
  }));
  for (const row of hourly) {
    const isToday = row.day.getTime() >= ubDateKey(now).getTime();
    const slot = series[row.hour];
    if (isToday) slot.today = row.revenue;
    else slot.yesterday = row.revenue;
  }

  const insights: string[] = [];
  const change = percentChange(todayRevenue, yesterdayRevenue);
  if (change !== null && yesterdayRevenue > 0) {
    if (change > 0) insights.push(`Өнөөдрийн борлуулалт өчигдрийн энэ цагаас ${change}% өссөн.`);
    else if (change < 0) insights.push(`Өнөөдрийн борлуулалт өчигдрийн энэ цагаас ${Math.abs(change)}% буурсан.`);
    else insights.push("Өнөөдрийн борлуулалт өчигдрийн энэ цагийнхтай ижил байна.");
  }
  if (topItem[0]) {
    insights.push(`Хамгийн их захиалсан бүтээгдэхүүн: ${topItem[0].name} (${topItem[0]._sum.quantity ?? 0} ширхэг)`);
  }
  const peak = series.reduce((best, s) => (s.today > best.today ? s : best), series[0]);
  if (peak.today > 0) {
    insights.push(`Өнөөдрийн оргил цаг: ${String(peak.hour).padStart(2, "0")}:00 цагаас ${String(peak.hour + 1).padStart(2, "0")}:00 хүртэл.`);
  }

  return {
    todayRevenue,
    yesterdayRevenue,
    revenueChange: change,
    todayOrders: today._count,
    yesterdayOrders: yesterday._count,
    avgOrder: today._count ? Math.round(todayRevenue / today._count) : 0,
    pendingOrders: pending,
    activeTables,
    totalTables,
    series,
    currentHour: todayHour,
    insights,
    recent: recent.map((o) => ({
      id: o.id,
      number: o.number,
      status: o.status,
      type: o.type,
      total: o.total,
      createdAt: o.createdAt.toISOString(),
      table: o.table?.number ?? null,
      customerName: o.customerName,
      itemCount: o._count.items,
    })),
  };
}

type HourRow = { day: Date; hour: number; revenue: number; orders: number };

async function hourlySales(restaurantId: string, from: Date, to: Date): Promise<HourRow[]> {
  const rows = await db.$queryRaw<Array<{ day: Date; hour: number; revenue: bigint | null; orders: bigint }>>(Prisma.sql`
    SELECT date_trunc('day', "createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ulaanbaatar')::date AS day,
           EXTRACT(HOUR FROM "createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ulaanbaatar')::int AS hour,
           SUM("total") AS revenue,
           COUNT(*) AS orders
    FROM "Order"
    WHERE "restaurantId" = ${restaurantId}
      AND "createdAt" >= ${from} AND "createdAt" < ${to}
      AND "status" <> 'CANCELLED'
    GROUP BY 1, 2
    ORDER BY 1, 2`);
  return rows.map((r) => ({ day: new Date(r.day), hour: r.hour, revenue: Number(r.revenue ?? 0), orders: Number(r.orders) }));
}

export type AnalyticsRange = 7 | 30 | 90;

export async function getAnalytics(restaurantId: string, range: AnalyticsRange) {
  const now = new Date();
  const from = startOfUbDay(now, -(range - 1));
  const prevFrom = startOfUbDay(now, -(range * 2 - 1));

  // Өнөөдрийн мэдээллийг шинэчилж байж уншина
  await refreshAnalyticsDay(restaurantId, now);

  const [days, prevAgg, topItems, topCategories, peakHours, weekdayRows, typeAgg] = await Promise.all([
    db.analytics.findMany({
      where: { restaurantId, date: { gte: ubDateKey(from) } },
      orderBy: { date: "asc" },
    }),
    db.analytics.aggregate({
      where: { restaurantId, date: { gte: ubDateKey(prevFrom), lt: ubDateKey(from) } },
      _sum: { revenue: true, orders: true },
    }),
    db.orderItem.groupBy({
      by: ["name"],
      where: { order: { restaurantId, createdAt: { gte: from }, status: { not: "CANCELLED" } } },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { lineTotal: "desc" } },
      take: 8,
    }),
    db.$queryRaw<Array<{ name: string; revenue: bigint; quantity: bigint }>>(Prisma.sql`
      SELECT c."name" AS name, SUM(oi."lineTotal") AS revenue, SUM(oi."quantity") AS quantity
      FROM "OrderItem" oi
      JOIN "Order" o ON o."id" = oi."orderId"
      JOIN "MenuItem" mi ON mi."id" = oi."menuItemId"
      JOIN "MenuCategory" c ON c."id" = mi."categoryId"
      WHERE o."restaurantId" = ${restaurantId} AND o."createdAt" >= ${from} AND o."status" <> 'CANCELLED'
      GROUP BY c."name"
      ORDER BY revenue DESC
      LIMIT 6`),
    db.$queryRaw<Array<{ hour: number; orders: bigint; revenue: bigint }>>(Prisma.sql`
      SELECT EXTRACT(HOUR FROM "createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ulaanbaatar')::int AS hour,
             COUNT(*) AS orders, SUM("total") AS revenue
      FROM "Order"
      WHERE "restaurantId" = ${restaurantId} AND "createdAt" >= ${from} AND "status" <> 'CANCELLED'
      GROUP BY 1 ORDER BY 1`),
    db.$queryRaw<Array<{ dow: number; revenue: bigint }>>(Prisma.sql`
      SELECT EXTRACT(DOW FROM "createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ulaanbaatar')::int AS dow,
             SUM("total") AS revenue
      FROM "Order"
      WHERE "restaurantId" = ${restaurantId} AND "createdAt" >= ${from} AND "status" <> 'CANCELLED'
      GROUP BY 1`),
    db.analytics.aggregate({
      where: { restaurantId, date: { gte: ubDateKey(from) } },
      _sum: { dineIn: true, takeaway: true, delivery: true, cancelled: true },
    }),
  ]);

  // Хоосон өдрүүдийг 0-ээр нөхнө
  const byDate = new Map(days.map((d) => [d.date.toISOString().slice(0, 10), d]));
  const series = Array.from({ length: range }, (_, i) => {
    const key = ubDateKey(startOfUbDay(now, -(range - 1 - i)));
    const iso = key.toISOString().slice(0, 10);
    const row = byDate.get(iso);
    return { date: iso, revenue: row?.revenue ?? 0, orders: row?.orders ?? 0 };
  });

  const totalRevenue = series.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = series.reduce((s, d) => s + d.orders, 0);
  const prevRevenue = prevAgg._sum.revenue ?? 0;
  const prevOrders = prevAgg._sum.orders ?? 0;

  const todayKey = ubDateKey(now).toISOString().slice(0, 10);
  const today = series.find((s) => s.date === todayKey);
  const last7 = series.slice(-7).reduce((s, d) => s + d.revenue, 0);
  const monthStartKey = (() => {
    const p = ubParts(now);
    return new Date(Date.UTC(p.year, p.month - 1, 1)).toISOString().slice(0, 10);
  })();
  const month = await db.analytics.aggregate({
    where: { restaurantId, date: { gte: new Date(monthStartKey) } },
    _sum: { revenue: true },
  });

  const hours = Array.from({ length: 24 }, (_, h) => {
    const row = peakHours.find((p) => p.hour === h);
    return { hour: h, orders: Number(row?.orders ?? 0), revenue: Number(row?.revenue ?? 0) };
  });
  const peak = hours.reduce((b, h) => (h.orders > b.orders ? h : b), hours[0]);

  const weekdays = [1, 2, 3, 4, 5, 6, 0].map((dow) => ({
    dow,
    revenue: Number(weekdayRows.find((w) => w.dow === dow)?.revenue ?? 0),
  }));

  return {
    range,
    series,
    totalRevenue,
    totalOrders,
    avgOrder: totalOrders ? Math.round(totalRevenue / totalOrders) : 0,
    revenueChange: percentChange(totalRevenue, prevRevenue),
    ordersChange: percentChange(totalOrders, prevOrders),
    todayRevenue: today?.revenue ?? 0,
    weekRevenue: last7,
    monthRevenue: month._sum.revenue ?? 0,
    topItems: topItems.map((t) => ({ name: t.name, quantity: t._sum.quantity ?? 0, revenue: t._sum.lineTotal ?? 0 })),
    topCategories: topCategories.map((c) => ({ name: c.name, revenue: Number(c.revenue), quantity: Number(c.quantity) })),
    hours,
    peakHour: peak.orders > 0 ? peak.hour : null,
    weekdays,
    types: {
      dineIn: typeAgg._sum.dineIn ?? 0,
      takeaway: typeAgg._sum.takeaway ?? 0,
      delivery: typeAgg._sum.delivery ?? 0,
      cancelled: typeAgg._sum.cancelled ?? 0,
    },
  };
}

export type AnalyticsData = Awaited<ReturnType<typeof getAnalytics>>;
