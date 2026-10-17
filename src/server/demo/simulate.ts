// Демо ресторанд бодит цагийн идэвх үүсгэнэ: өнгөрсөн цагийн захиалгыг нөхөж,
// гал тогоонд шинэ захиалга орж ирэх мэт харагдуулна. Зөвхөн isDemo=true ресторанд ажиллана.
import crypto from "node:crypto";
import type { OrderType, Prisma, PrismaClient } from "@prisma/client";
import { startOfUbDay, ubParts } from "@/lib/format";
import { FIRST_NAMES } from "./catalog";

const HOUR_WEIGHTS: Record<number, number> = {
  8: 3, 9: 4, 10: 3, 11: 5, 12: 10, 13: 11, 14: 6, 15: 3, 16: 3, 17: 5, 18: 9, 19: 11, 20: 8, 21: 5, 22: 2,
};
const WEIGHT_SUM = Object.values(HOUR_WEIGHTS).reduce((a, b) => a + b, 0);
const DAILY_ORDERS = 56;
const THROTTLE_MS = 45_000;

type MenuRow = { id: string; name: string; price: number; categoryName: string };

export async function simulateDemoActivity(db: PrismaClient, restaurantId: string): Promise<boolean> {
  const now = new Date();
  // Давхар ажиллахаас сэргийлж атомаар түгжинэ
  const lock = await db.restaurant.updateMany({
    where: {
      id: restaurantId,
      isDemo: true,
      OR: [{ demoSimulatedAt: null }, { demoSimulatedAt: { lt: new Date(now.getTime() - THROTTLE_MS) } }],
    },
    data: { demoSimulatedAt: now },
  });
  if (lock.count === 0) return false;

  const restaurant = await db.restaurant.findUniqueOrThrow({ where: { id: restaurantId } });
  const menu: MenuRow[] = (
    await db.menuItem.findMany({
      where: { restaurantId, isAvailable: true },
      select: { id: true, name: true, price: true, category: { select: { name: true } } },
    })
  ).map((m) => ({ id: m.id, name: m.name, price: m.price, categoryName: m.category.name }));
  if (menu.length === 0) return false;
  const tables = await db.table.findMany({ where: { restaurantId } });
  const customers = await db.customer.findMany({ where: { restaurantId }, select: { id: true, name: true, phone: true }, take: 50 });

  const rnd = Math.random;
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];

  const lastOrder = await db.order.findFirst({ where: { restaurantId }, orderBy: { createdAt: "desc" } });
  const historyFrom = lastOrder ? lastOrder.createdAt : startOfUbDay(now);
  const historyTo = new Date(now.getTime() - 30 * 60000);

  let seq = restaurant.orderSeq;
  const orders: Prisma.OrderCreateManyInput[] = [];
  const items: Prisma.OrderItemCreateManyInput[] = [];
  const payments: Prisma.PaymentCreateManyInput[] = [];

  const makeOrder = (createdAt: Date, opts: { live: boolean; type?: OrderType; tableId?: string | null }) => {
    const hour = ubParts(createdAt).hour;
    const id = crypto.randomUUID();
    const pool = menu.filter((m) => hour < 11 || m.categoryName !== "Өглөөний цай");
    const lines = 1 + Math.floor(rnd() * 3);
    const used = new Set<string>();
    let subtotal = 0;
    for (let i = 0; i < lines; i++) {
      const item = pick(pool);
      if (used.has(item.id)) continue;
      used.add(item.id);
      const qty = rnd() < 0.7 ? 1 : 2;
      subtotal += item.price * qty;
      items.push({ id: crypto.randomUUID(), orderId: id, menuItemId: item.id, name: item.name, unitPrice: item.price, quantity: qty, lineTotal: item.price * qty, options: [] });
    }
    const type: OrderType = opts.type ?? (rnd() < 0.72 ? "DINE_IN" : rnd() < 0.7 ? "TAKEAWAY" : "DELIVERY");
    const customer = rnd() < 0.5 && customers.length ? pick(customers) : null;
    const serviceFee = type === "DINE_IN" ? Math.round((subtotal * restaurant.serviceFeePercent) / 100) : 0;
    const deliveryFee = type === "DELIVERY" ? restaurant.deliveryFee : 0;
    const total = subtotal + serviceFee + deliveryFee;
    const prep = 8 + Math.floor(rnd() * 10);
    seq += 1;
    orders.push({
      id,
      restaurantId,
      number: seq,
      publicToken: crypto.randomBytes(16).toString("base64url"),
      type,
      status: opts.live ? "NEW" : "DELIVERED",
      tableId: type === "DINE_IN" ? (opts.tableId ?? pick(tables)?.id ?? null) : null,
      customerId: customer?.id ?? null,
      customerName: customer?.name ?? (type !== "DINE_IN" ? pick(FIRST_NAMES) : null),
      customerPhone: customer?.phone ?? null,
      deliveryAddress: type === "DELIVERY" ? "ХУД, 3-р хороо, Зайсан, 18-р байр" : null,
      subtotal,
      serviceFee,
      deliveryFee,
      total,
      isPaid: !opts.live,
      createdAt,
      confirmedAt: opts.live ? null : new Date(createdAt.getTime() + 60000),
      startedAt: opts.live ? null : new Date(createdAt.getTime() + 3 * 60000),
      readyAt: opts.live ? null : new Date(createdAt.getTime() + (3 + prep) * 60000),
      deliveredAt: opts.live ? null : new Date(createdAt.getTime() + (6 + prep) * 60000),
    });
    payments.push({
      restaurantId,
      orderId: id,
      amount: total,
      method: opts.live ? "CASH" : pick(["CASH", "CARD", "QPAY"] as const),
      status: opts.live ? "PENDING" : "PAID",
      provider: "counter",
      paidAt: opts.live ? null : new Date(createdAt.getTime() + 30 * 60000),
      createdAt,
    });
    return { id, customerId: customer?.id ?? null, total };
  };

  // 1. Өнгөрсөн хугацааны захиалгыг цагийн жингээр нөхөх
  const paidByCustomer = new Map<string, number>();
  if (historyTo > historyFrom) {
    const span = Math.min(historyTo.getTime() - historyFrom.getTime(), 3 * 24 * 3600000);
    const start = historyTo.getTime() - span;
    for (let t = start; t < historyTo.getTime(); t += 10 * 60000) {
      const hour = ubParts(t).hour;
      const expected = (DAILY_ORDERS * (HOUR_WEIGHTS[hour] ?? 0)) / WEIGHT_SUM / 6;
      let n = Math.floor(expected + rnd());
      while (n-- > 0) {
        const at = new Date(t + Math.floor(rnd() * 10 * 60000));
        if (at > historyTo) continue;
        const o = makeOrder(at, { live: false });
        if (o.customerId) paidByCustomer.set(o.customerId, (paidByCustomer.get(o.customerId) ?? 0) + o.total);
      }
    }
  }

  // 2. Хуучирсан идэвхтэй захиалгыг дуусгах (ажилтан хөндөөгүй тохиолдолд)
  const stale = await db.order.findMany({
    where: { restaurantId, status: { in: ["NEW", "CONFIRMED", "PREPARING", "READY"] }, createdAt: { lt: new Date(now.getTime() - 40 * 60000) } },
  });
  for (const o of stale) {
    await db.order.update({
      where: { id: o.id },
      data: {
        status: "DELIVERED",
        confirmedAt: o.confirmedAt ?? now,
        startedAt: o.startedAt ?? now,
        readyAt: o.readyAt ?? now,
        deliveredAt: now,
      },
    });
  }
  const unpaid = await db.order.findMany({
    where: { restaurantId, status: "DELIVERED", isPaid: false, createdAt: { lt: new Date(now.getTime() - 90 * 60000) } },
  });
  for (const o of unpaid) {
    await db.order.update({ where: { id: o.id }, data: { isPaid: true } });
    await db.payment.updateMany({ where: { orderId: o.id, status: "PENDING" }, data: { status: "PAID", paidAt: now } });
    if (o.customerId) paidByCustomer.set(o.customerId, (paidByCustomer.get(o.customerId) ?? 0) + o.total);
  }
  // Төлбөр хаагдсан ширээг чөлөөлөх, бүх захиалга хүргэгдсэн ширээг төлбөр хүлээж буй болгох
  for (const t of tables) {
    const open = await db.order.findMany({ where: { tableId: t.id, isPaid: false, status: { not: "CANCELLED" } }, select: { status: true } });
    if (open.length === 0 && (t.status === "ORDERED" || t.status === "AWAITING_PAYMENT") && t.occupiedAt && now.getTime() - t.occupiedAt.getTime() > 60 * 60000) {
      await db.table.update({ where: { id: t.id }, data: { status: "FREE", occupiedAt: null, guestName: null } });
    } else if (open.length > 0 && open.every((o) => o.status === "DELIVERED") && t.status === "ORDERED") {
      await db.table.update({ where: { id: t.id }, data: { status: "AWAITING_PAYMENT" } });
    }
  }

  // 3. Шинэ "амьд" захиалга
  const activeCount = await db.order.count({ where: { restaurantId, status: { in: ["NEW", "CONFIRMED", "PREPARING"] } } });
  const latest = await db.order.findFirst({ where: { restaurantId }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
  const quietFor = latest ? now.getTime() - latest.createdAt.getTime() : Infinity;
  if (activeCount < 4 && quietFor > 150_000) {
    const free = tables.filter((t) => t.status === "FREE" || t.status === "SEATED");
    const table = free.length ? pick(free) : null;
    makeOrder(now, { live: true, type: table && rnd() < 0.75 ? "DINE_IN" : rnd() < 0.6 ? "TAKEAWAY" : "DELIVERY", tableId: table?.id ?? null });
    const created = orders[orders.length - 1];
    if (created.tableId) {
      const t = tables.find((x) => x.id === created.tableId)!;
      await db.table.update({ where: { id: t.id }, data: { status: "ORDERED", occupiedAt: t.occupiedAt ?? now } });
    }
  }

  if (orders.length) {
    await db.order.createMany({ data: orders });
    await db.orderItem.createMany({ data: items });
    await db.payment.createMany({ data: payments });
    await db.restaurant.update({ where: { id: restaurantId }, data: { orderSeq: seq } });
  }
  for (const [id, amount] of paidByCustomer) {
    await db.customer.update({ where: { id }, data: { visits: { increment: 1 }, totalSpent: { increment: amount }, lastVisitAt: now } });
  }
  return orders.length > 0 || stale.length > 0;
}
