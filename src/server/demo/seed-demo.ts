// Демо ресторан "ХОТЫН БУУЗ"-ыг бүрэн өгөгдөлтэй үүсгэнэ.
// prisma/seed.ts болон /api/cron/demo-reset ашиглана. "server-only" импортлохгүй (tsx-ээр ажиллана).
import crypto from "node:crypto";
import type { OrderStatus, OrderType, PaymentMethod, Prisma, PrismaClient, TableStatus } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { startOfUbDay, ubDateKey, ubParts } from "@/lib/format";
import { DEMO_MENU, DEMO_TABLES, FIRST_NAMES, RESERVATION_NOTES, REVIEW_COMMENTS } from "./catalog";

import { DEMO_ACCOUNTS, DEMO_PASSWORD, DEMO_SLUG } from "./constants";

export { DEMO_ACCOUNTS, DEMO_PASSWORD, DEMO_SLUG };

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HOUR_WEIGHTS: Record<number, number> = {
  8: 3, 9: 4, 10: 3, 11: 5, 12: 10, 13: 11, 14: 6, 15: 3, 16: 3, 17: 5, 18: 9, 19: 11, 20: 8, 21: 5, 22: 2,
};
const WEEKDAY_FACTOR = [1.15, 0.85, 0.9, 0.95, 1.0, 1.35, 1.4];

export async function seedDemo(db: PrismaClient, opts: { days?: number; log?: (m: string) => void } = {}) {
  const log = opts.log ?? (() => {});
  const days = opts.days ?? 60;
  const rnd = mulberry32(20261017);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
  const weighted = <T,>(arr: T[], w: (x: T) => number) => {
    const total = arr.reduce((s, x) => s + w(x), 0);
    let r = rnd() * total;
    for (const x of arr) {
      r -= w(x);
      if (r <= 0) return x;
    }
    return arr[arr.length - 1];
  };
  const now = new Date();

  // 1. Хуучин демо өгөгдлийг цэвэрлэх
  await db.restaurant.deleteMany({ where: { slug: DEMO_SLUG } });
  log("Хуучин демо өгөгдлийг устгалаа.");

  // 2. Хэрэглэгчид
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const users: Record<string, string> = {};
  for (const [key, acc] of Object.entries(DEMO_ACCOUNTS)) {
    const role = key === "customer" ? "CUSTOMER" : "OWNER";
    const u = await db.user.upsert({
      where: { email: acc.email },
      create: { email: acc.email, name: acc.name, passwordHash, role, phone: key === "customer" ? "99112233" : null },
      update: { name: acc.name, passwordHash, role },
    });
    users[key] = u.id;
  }

  // 3. Ресторан
  const restaurant = await db.restaurant.create({
    data: {
      slug: DEMO_SLUG,
      name: "ХОТЫН БУУЗ",
      tagline: "Гар хийцийн бууз, гэрийн амт",
      description: "Зохиомол демо ресторан. TABLE.MN системийн бүх боломжийг туршихад зориулсан.",
      address: "Сөүлийн гудамж 14, 1-р давхар",
      district: "Сүхбаатар дүүрэг, Улаанбаатар",
      phone: "7700 1234",
      email: "hello@hotynbuuz.mn",
      brandColor: "#B4532A",
      logoText: "ХБ",
      serviceFeePercent: 5,
      deliveryFee: 5000,
      allowDineIn: true,
      allowTakeaway: true,
      allowDelivery: true,
      isDemo: true,
      onboardingStep: 7,
      openingHours: Array.from({ length: 7 }, (_, day) => ({
        day,
        open: "08:00",
        close: day === 5 || day === 6 ? "23:00" : "22:00",
        closed: false,
      })),
      staff: {
        create: [
          { userId: users.owner, role: "OWNER" },
          { userId: users.manager, role: "MANAGER" },
          { userId: users.waiter, role: "WAITER" },
          { userId: users.kitchen, role: "KITCHEN" },
        ],
      },
      menus: { create: { name: "Үндсэн меню" } },
    },
    include: { menus: true },
  });
  const rid = restaurant.id;
  const menuId = restaurant.menus[0].id;

  // 4. Меню
  type SeededItem = { id: string; name: string; price: number; weight: number; prep: number; category: string; options: Array<{ id: string; kind: "OPTION" | "ADDON"; groupName: string | null; name: string; priceDelta: number; isDefault: boolean }> };
  const seededItems: SeededItem[] = [];
  for (const [ci, cat] of DEMO_MENU.entries()) {
    const category = await db.menuCategory.create({
      data: { restaurantId: rid, menuId, name: cat.name, description: cat.description ?? null, position: ci },
    });
    for (const [ii, item] of cat.items.entries()) {
      const created = await db.menuItem.create({
        data: {
          restaurantId: rid,
          categoryId: category.id,
          name: item.name,
          description: item.description,
          price: item.price,
          artKey: item.artKey,
          ingredients: item.ingredients ?? [],
          isAvailable: item.available ?? true,
          isPopular: item.popular ?? false,
          isFeatured: item.featured ?? false,
          prepMinutes: item.prep ?? 10,
          position: ii,
          options: {
            create: (item.options ?? []).map((o, position) => ({
              kind: o.kind,
              groupName: o.groupName ?? null,
              name: o.name,
              priceDelta: o.priceDelta,
              isDefault: o.isDefault ?? false,
              position,
            })),
          },
        },
        include: { options: true },
      });
      seededItems.push({ id: created.id, name: created.name, price: created.price, weight: item.weight, prep: created.prepMinutes, category: cat.name, options: created.options });
    }
  }
  log(`${seededItems.length} бүтээгдэхүүн нэмлээ.`);

  // 5. Ширээ, QR
  const tables = [];
  for (const t of DEMO_TABLES) {
    tables.push(await db.table.create({ data: { ...t, restaurantId: rid } }));
  }
  const qrCode = () => crypto.randomBytes(5).toString("base64url").replace(/[-_]/g, "x").toLowerCase();
  await db.qRCode.createMany({
    data: [
      { restaurantId: rid, type: "RESTAURANT", code: qrCode(), scans: 412 },
      ...tables.map((t) => ({ restaurantId: rid, tableId: t.id, type: "TABLE" as const, code: qrCode(), scans: 40 + Math.floor(rnd() * 160) })),
    ],
  });

  // 6. Үйлчлүүлэгчид
  const customerRows = FIRST_NAMES.map((name, i) => ({
    id: crypto.randomUUID(),
    restaurantId: rid,
    name,
    phone: `${pick(["88", "99", "95", "94", "80", "86"])}${String(100000 + Math.floor(rnd() * 899999)).slice(0, 6)}`,
    userId: name === "Сараа" ? users.customer : null,
    // Давтамжийн жин: эхний хэдэн хүн байнгын үйлчлүүлэгч
    weight: i === 0 ? 0 : Math.max(0.4, 6 / (i + 1)),
  }));
  customerRows[1].phone = "99112233"; // Сараа: демо үйлчлүүлэгчийн бүртгэлтэй холбоотой
  const seenPhones = new Set<string>();
  for (const c of customerRows) {
    while (seenPhones.has(c.phone)) c.phone = String(Number(c.phone) + 7);
    seenPhones.add(c.phone);
  }
  await db.customer.createMany({
    data: customerRows.map(({ weight: _w, ...c }) => c),
  });

  // 7. Захиалгын түүх
  type OrderRow = Prisma.OrderCreateManyInput & { id: string; createdAt: Date };
  const orders: OrderRow[] = [];
  const items: Prisma.OrderItemCreateManyInput[] = [];
  const payments: Prisma.PaymentCreateManyInput[] = [];

  const favoriteNames = ["Бууз", "Цуйван", "Латте"];
  const favoriteItems = seededItems.filter((i) => favoriteNames.includes(i.name));
  let number = 1000;

  const buildLines = (orderId: string, hour: number, forcedFavorites: boolean) => {
    const lineCount = forcedFavorites ? 3 : weighted([1, 2, 3, 4], (n) => [3, 5, 3, 1][n - 1]);
    const pool = seededItems.filter((i) => i.weight > 0 && (hour < 11 || !["Өглөөний цай"].includes(i.category)));
    const chosen = new Set<string>();
    let subtotal = 0;
    for (let l = 0; l < lineCount; l++) {
      const item = forcedFavorites ? favoriteItems[l % favoriteItems.length] : weighted(pool, (i) => i.weight);
      if (chosen.has(item.id)) continue;
      chosen.add(item.id);
      const qty = forcedFavorites ? (item.name === "Латте" ? 1 : 2) : weighted([1, 2, 3], (q) => [7, 3, 1][q - 1]);
      const groups = new Map<string, SeededItem["options"]>();
      for (const o of item.options.filter((o) => o.kind === "OPTION" && o.groupName)) {
        groups.set(o.groupName!, [...(groups.get(o.groupName!) ?? []), o]);
      }
      const opts: Array<{ name: string; priceDelta: number; kind: "OPTION" | "ADDON" }> = [];
      for (const list of groups.values()) {
        const sel = rnd() < 0.25 ? pick(list) : (list.find((o) => o.isDefault) ?? list[0]);
        opts.push({ name: sel.name, priceDelta: sel.priceDelta, kind: "OPTION" });
      }
      for (const add of item.options.filter((o) => o.kind === "ADDON")) {
        if (rnd() < 0.15) opts.push({ name: add.name, priceDelta: add.priceDelta, kind: "ADDON" });
      }
      const unit = item.price + opts.reduce((s, o) => s + o.priceDelta, 0);
      subtotal += unit * qty;
      items.push({
        id: crypto.randomUUID(),
        orderId,
        menuItemId: item.id,
        name: item.name,
        unitPrice: unit,
        quantity: qty,
        options: opts,
        lineTotal: unit * qty,
      });
    }
    return subtotal;
  };

  const batOrderSlots = new Set<number>();
  while (batOrderSlots.size < 14) batOrderSlots.add(2 + Math.floor(rnd() * (days - 3)));

  for (let offset = days - 1; offset >= 0; offset--) {
    const dayStart = startOfUbDay(now, -offset);
    const weekday = ubParts(new Date(dayStart.getTime() + 12 * 3600000)).weekday;
    const trend = 0.86 + ((days - offset) / days) * 0.2;
    const isToday = offset === 0;
    const base = Math.round(52 * WEEKDAY_FACTOR[weekday] * trend * (0.9 + rnd() * 0.2) * (isToday ? 1.08 : 1));
    let batPlaced = !batOrderSlots.has(offset);

    for (let n = 0; n < base; n++) {
      const hour = Number(weighted(Object.keys(HOUR_WEIGHTS), (h) => HOUR_WEIGHTS[Number(h)]));
      const createdAt = new Date(dayStart.getTime() + hour * 3600000 + Math.floor(rnd() * 3600000));
      // Өнөөдрийн хувьд одоогоос 30 минутын өмнөх захиалгууд түүх болно
      if (createdAt.getTime() > now.getTime() - 30 * 60000) continue;
      const id = crypto.randomUUID();
      const type: OrderType = weighted(["DINE_IN", "TAKEAWAY", "DELIVERY"] as const, (t) => ({ DINE_IN: 72, TAKEAWAY: 20, DELIVERY: 8 })[t]);
      const forBat = !batPlaced && type === "DINE_IN" && hour >= 11;
      if (forBat) batPlaced = true;
      const customer = forBat ? customerRows[0] : rnd() < 0.55 ? weighted(customerRows, (c) => c.weight) : null;
      const subtotal = buildLines(id, hour, forBat);
      if (subtotal === 0) continue;
      const serviceFee = type === "DINE_IN" ? Math.round(subtotal * 0.05) : 0;
      const deliveryFee = type === "DELIVERY" ? 5000 : 0;
      const total = subtotal + serviceFee + deliveryFee;
      const cancelled = !forBat && rnd() < 0.035;
      const prep = 6 + Math.floor(rnd() * 14);
      const status: OrderStatus = cancelled ? "CANCELLED" : "DELIVERED";
      number += 1;
      orders.push({
        id,
        restaurantId: rid,
        number,
        publicToken: crypto.randomBytes(16).toString("base64url"),
        type,
        status,
        tableId: type === "DINE_IN" ? pick(tables).id : null,
        customerId: customer?.id ?? null,
        userId: customer?.userId ?? null,
        customerName: customer?.name ?? (type !== "DINE_IN" ? pick(FIRST_NAMES) : null),
        customerPhone: customer?.phone ?? null,
        deliveryAddress: type === "DELIVERY" ? `${pick(["БЗД", "СБД", "ХУД", "СХД", "ЧД"])}, ${1 + Math.floor(rnd() * 20)}-р хороо, ${10 + Math.floor(rnd() * 90)}-р байр` : null,
        subtotal,
        serviceFee,
        deliveryFee,
        total,
        isPaid: !cancelled,
        createdAt,
        confirmedAt: new Date(createdAt.getTime() + 60000),
        startedAt: cancelled ? null : new Date(createdAt.getTime() + 3 * 60000),
        readyAt: cancelled ? null : new Date(createdAt.getTime() + (3 + prep) * 60000),
        deliveredAt: cancelled ? null : new Date(createdAt.getTime() + (6 + prep) * 60000),
        cancelledAt: cancelled ? new Date(createdAt.getTime() + 4 * 60000) : null,
        cancelReason: cancelled ? pick(["Үйлчлүүлэгч цуцалсан", "Бүтээгдэхүүн дууссан"]) : null,
      });
      if (!cancelled) {
        const method: PaymentMethod = weighted(["CASH", "CARD", "QPAY"] as const, (m) => ({ CASH: 25, CARD: 40, QPAY: 35 })[m]);
        payments.push({
          restaurantId: rid,
          orderId: id,
          amount: total,
          method,
          status: "PAID",
          provider: method === "QPAY" ? "demo" : "counter",
          paidAt: new Date(createdAt.getTime() + (25 + prep) * 60000),
          createdAt,
        });
      }
    }
  }

  // 8. Одоо явагдаж буй захиалгууд (гал тогоо, ширээнд харагдана)
  const liveSpec: Array<{ minAgo: number; status: OrderStatus; type: OrderType; table?: number }> = [
    { minAgo: 2, status: "NEW", type: "DINE_IN", table: 12 },
    { minAgo: 4, status: "NEW", type: "TAKEAWAY" },
    { minAgo: 7, status: "CONFIRMED", type: "DINE_IN", table: 5 },
    { minAgo: 9, status: "PREPARING", type: "DINE_IN", table: 8 },
    { minAgo: 13, status: "PREPARING", type: "DELIVERY" },
    { minAgo: 18, status: "PREPARING", type: "DINE_IN", table: 2 },
    { minAgo: 21, status: "READY", type: "DINE_IN", table: 9 },
    { minAgo: 27, status: "DELIVERED", type: "DINE_IN", table: 6 },
    { minAgo: 46, status: "DELIVERED", type: "DINE_IN", table: 13 },
  ];
  const tableByNumber = new Map(tables.map((t) => [t.number, t]));
  const tableState = new Map<string, { status: TableStatus; occupiedAt: Date; guestName: string | null }>();
  const liveHour = ubParts(now).hour;
  for (const spec of liveSpec) {
    const id = crypto.randomUUID();
    const createdAt = new Date(now.getTime() - spec.minAgo * 60000);
    const customer = rnd() < 0.6 ? weighted(customerRows.slice(1), (c) => c.weight) : null;
    const subtotal = buildLines(id, Math.max(liveHour, 11), false);
    const serviceFee = spec.type === "DINE_IN" ? Math.round(subtotal * 0.05) : 0;
    const deliveryFee = spec.type === "DELIVERY" ? 5000 : 0;
    const table = spec.table ? tableByNumber.get(spec.table)! : null;
    const at = (m: number) => new Date(createdAt.getTime() + m * 60000);
    const reached = (s: OrderStatus) => ["NEW", "CONFIRMED", "PREPARING", "READY", "DELIVERED"].indexOf(spec.status) >= ["NEW", "CONFIRMED", "PREPARING", "READY", "DELIVERED"].indexOf(s);
    number += 1;
    orders.push({
      id,
      restaurantId: rid,
      number,
      publicToken: crypto.randomBytes(16).toString("base64url"),
      type: spec.type,
      status: spec.status,
      tableId: table?.id ?? null,
      customerId: customer?.id ?? null,
      userId: customer?.userId ?? null,
      customerName: customer?.name ?? (spec.type !== "DINE_IN" ? pick(FIRST_NAMES) : null),
      customerPhone: customer?.phone ?? null,
      deliveryAddress: spec.type === "DELIVERY" ? "СБД, 1-р хороо, Олимпийн гудамж 12, 34 тоот" : null,
      note: spec.minAgo === 9 ? "Нэг хүүхэд байгаа тул халуун ногоогүй." : null,
      subtotal,
      serviceFee,
      deliveryFee,
      total: subtotal + serviceFee + deliveryFee,
      isPaid: false,
      createdAt,
      confirmedAt: reached("CONFIRMED") ? at(1) : null,
      startedAt: reached("PREPARING") ? at(Math.min(3, spec.minAgo - 1)) : null,
      readyAt: reached("READY") ? at(Math.max(4, spec.minAgo - 6)) : null,
      deliveredAt: reached("DELIVERED") ? at(Math.max(6, spec.minAgo - 3)) : null,
    });
    payments.push({ restaurantId: rid, orderId: id, amount: subtotal + serviceFee + deliveryFee, method: "CASH", status: "PENDING", provider: "counter", createdAt });
    if (table) {
      tableState.set(table.id, {
        status: spec.status === "DELIVERED" ? "AWAITING_PAYMENT" : "ORDERED",
        occupiedAt: new Date(createdAt.getTime() - 5 * 60000),
        guestName: customer?.name ?? null,
      });
    }
  }
  // Суусан боловч захиалаагүй ширээ
  tableState.set(tableByNumber.get(3)!.id, { status: "SEATED", occupiedAt: new Date(now.getTime() - 3 * 60000), guestName: null });
  tableState.set(tableByNumber.get(10)!.id, { status: "SEATED", occupiedAt: new Date(now.getTime() - 6 * 60000), guestName: "Хулан" });

  for (let i = 0; i < orders.length; i += 1000) await db.order.createMany({ data: orders.slice(i, i + 1000) });
  for (let i = 0; i < items.length; i += 3000) await db.orderItem.createMany({ data: items.slice(i, i + 3000) });
  for (let i = 0; i < payments.length; i += 2000) await db.payment.createMany({ data: payments.slice(i, i + 2000) });
  await db.restaurant.update({ where: { id: rid }, data: { orderSeq: number } });
  log(`${orders.length} захиалга, ${items.length} мөр үүсгэлээ.`);

  // 9. Үйлчлүүлэгчийн статистик
  const stats = new Map<string, { visits: number; spent: number; last: Date }>();
  for (const o of orders) {
    if (!o.customerId || !o.isPaid) continue;
    const s = stats.get(o.customerId) ?? { visits: 0, spent: 0, last: o.createdAt };
    s.visits += 1;
    s.spent += o.total as number;
    if (o.createdAt > s.last) s.last = o.createdAt;
    stats.set(o.customerId, s);
  }
  await db.$transaction(
    [...stats.entries()].map(([id, s]) =>
      db.customer.update({ where: { id }, data: { visits: s.visits, totalSpent: s.spent, lastVisitAt: s.last } }),
    ),
  );

  // 10. Ширээний одоогийн төлөв
  for (const [id, s] of tableState) await db.table.update({ where: { id }, data: s });

  // 11. Урьдчилсан захиалга
  const reservationPlan: Array<{ dayOffset: number; hour: number; minute: number; size: number; status: "PENDING" | "CONFIRMED" | "ARRIVED" | "CANCELLED"; table?: number }> = [
    { dayOffset: 0, hour: 12, minute: 30, size: 4, status: "ARRIVED", table: 10 },
    { dayOffset: 0, hour: 13, minute: 0, size: 2, status: "ARRIVED", table: 1 },
    { dayOffset: 0, hour: 18, minute: 30, size: 6, status: "CONFIRMED", table: 8 },
    { dayOffset: 0, hour: 19, minute: 0, size: 2, status: "PENDING" },
    { dayOffset: 0, hour: 19, minute: 30, size: 8, status: "CONFIRMED", table: 14 },
    { dayOffset: 0, hour: 20, minute: 0, size: 3, status: "CANCELLED" },
    { dayOffset: 1, hour: 12, minute: 0, size: 5, status: "CONFIRMED", table: 9 },
    { dayOffset: 1, hour: 13, minute: 15, size: 2, status: "PENDING" },
    { dayOffset: 1, hour: 18, minute: 0, size: 10, status: "CONFIRMED", table: 14 },
    { dayOffset: 1, hour: 19, minute: 45, size: 4, status: "PENDING" },
    { dayOffset: 2, hour: 19, minute: 0, size: 6, status: "CONFIRMED", table: 13 },
    { dayOffset: 3, hour: 12, minute: 30, size: 2, status: "PENDING" },
    { dayOffset: 4, hour: 18, minute: 30, size: 4, status: "CONFIRMED", table: 5 },
    { dayOffset: 5, hour: 20, minute: 0, size: 7, status: "PENDING" },
    { dayOffset: 6, hour: 13, minute: 0, size: 3, status: "CONFIRMED", table: 7 },
  ];
  // Өнөөдрийн ойрын нэг цагт ирэх захиалга (ширээ "Захиалгатай")
  const soon = new Date(now.getTime() + 45 * 60000);
  const soonParts = ubParts(soon);
  reservationPlan.push({ dayOffset: soonParts.day === ubParts(now).day ? 0 : 1, hour: soonParts.hour, minute: soonParts.minute - (soonParts.minute % 15), size: 4, status: "CONFIRMED", table: 11 });
  await db.reservation.createMany({
    data: reservationPlan.map((r, i) => {
      const c = customerRows[(i * 3 + 2) % customerRows.length];
      return {
        restaurantId: rid,
        customerId: c.id,
        name: c.name,
        phone: c.phone,
        partySize: r.size,
        startsAt: new Date(startOfUbDay(now, r.dayOffset).getTime() + (r.hour * 60 + r.minute) * 60000),
        status: r.status,
        tableId: r.table ? tableByNumber.get(r.table)!.id : null,
        note: RESERVATION_NOTES[i % RESERVATION_NOTES.length],
        source: i % 3 === 0 ? "online" : "staff",
      };
    }),
  });
  await db.table.update({ where: { id: tableByNumber.get(11)!.id }, data: { status: "RESERVED", guestName: customerRows[(15 * 3 + 2) % customerRows.length].name } });

  // 12. Сэтгэгдэл
  const paidWithCustomer = orders.filter((o) => o.customerId && o.isPaid);
  await db.review.createMany({
    data: Array.from({ length: 24 }, (_, i) => {
      const o = paidWithCustomer[Math.floor(rnd() * paidWithCustomer.length)];
      return {
        restaurantId: rid,
        customerId: o.customerId!,
        orderId: o.id,
        rating: weighted([3, 4, 5], (r) => (r === 3 ? 1 : r === 4 ? 4 : 9)),
        comment: REVIEW_COMMENTS[i % REVIEW_COMMENTS.length],
        createdAt: new Date(o.createdAt.getTime() + 90 * 60000),
      };
    }),
  });

  // 13. Өдрийн нэгтгэл
  const daily = new Map<string, { revenue: number; orders: number; cancelled: number; dineIn: number; takeaway: number; delivery: number }>();
  for (const o of orders) {
    const key = ubDateKey(o.createdAt).toISOString().slice(0, 10);
    const d = daily.get(key) ?? { revenue: 0, orders: 0, cancelled: 0, dineIn: 0, takeaway: 0, delivery: 0 };
    if (o.status === "CANCELLED") d.cancelled += 1;
    else {
      d.revenue += o.total as number;
      d.orders += 1;
      if (o.type === "DINE_IN") d.dineIn += 1;
      if (o.type === "TAKEAWAY") d.takeaway += 1;
      if (o.type === "DELIVERY") d.delivery += 1;
    }
    daily.set(key, d);
  }
  await db.analytics.createMany({
    data: [...daily.entries()].map(([date, d]) => ({
      restaurantId: rid,
      date: new Date(date),
      ...d,
      avgOrder: d.orders ? Math.round(d.revenue / d.orders) : 0,
    })),
  });
  log("Демо ресторан бэлэн боллоо.");
  return { restaurantId: rid, orders: orders.length };
}
