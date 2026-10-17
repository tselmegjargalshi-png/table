import "server-only";
import crypto from "node:crypto";
import type { OrderStatus, PaymentMethod, Prisma } from "@prisma/client";
import type { z } from "zod";
import { db } from "@/lib/db";
import { AppError, MESSAGES } from "@/lib/errors";
import { resolveProvider } from "@/server/payments/providers";
import type { placeOrderSchema } from "@/server/validation/schemas";
import { refreshAnalyticsDay } from "./analytics";

type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

export type OptionSnapshot = { name: string; priceDelta: number; kind: "OPTION" | "ADDON" };

const ACTIVE_STATUSES: OrderStatus[] = ["NEW", "CONFIRMED", "PREPARING", "READY"];

/** Үйлчлүүлэгч QR менюгээс захиалга өгөх */
export async function placeOrder(slug: string, input: PlaceOrderInput, userId?: string | null) {
  const restaurant = await db.restaurant.findUnique({ where: { slug } });
  if (!restaurant) throw new AppError("Ресторан олдсонгүй.", 404);
  if (!restaurant.acceptingOrders) {
    throw new AppError("Ресторан одоогоор онлайн захиалга хүлээн авахгүй байна.", 409);
  }
  const modeAllowed =
    (input.type === "DINE_IN" && restaurant.allowDineIn) ||
    (input.type === "TAKEAWAY" && restaurant.allowTakeaway) ||
    (input.type === "DELIVERY" && restaurant.allowDelivery);
  if (!modeAllowed) throw new AppError("Сонгосон захиалгын төрөл энэ ресторанд боломжгүй байна.", 409);

  // Ширээг QR кодоор эсвэл дугаараар тодорхойлно
  let tableId: string | null = null;
  if (input.type === "DINE_IN") {
    const table = input.tableCode
      ? (await db.qRCode.findFirst({
          where: { code: input.tableCode, restaurantId: restaurant.id, type: "TABLE" },
          include: { table: true },
        }))?.table
      : await db.table.findUnique({
          where: { restaurantId_number: { restaurantId: restaurant.id, number: input.tableNumber ?? -1 } },
        });
    if (!table) throw new AppError("Ширээний дугаар олдсонгүй. Ширээн дээрх QR кодыг дахин уншуулна уу.", 422);
    tableId = table.id;
  }

  const itemIds = [...new Set(input.lines.map((l) => l.itemId))];
  const items = await db.menuItem.findMany({
    where: { id: { in: itemIds }, restaurantId: restaurant.id },
    include: { options: true, category: { select: { isVisible: true } } },
  });
  const itemMap = new Map(items.map((i) => [i.id, i]));

  let subtotal = 0;
  const lines: Prisma.OrderItemCreateWithoutOrderInput[] = input.lines.map((line) => {
    const item = itemMap.get(line.itemId);
    if (!item || !item.category.isVisible) throw new AppError("Сагсанд байгаа зарим бүтээгдэхүүн менюнээс хасагдсан байна.", 409);
    if (!item.isAvailable) throw new AppError(`${item.name}: ${MESSAGES.soldOut}`, 409);

    const chosen = line.optionIds.map((oid) => {
      const opt = item.options.find((o) => o.id === oid);
      if (!opt) throw new AppError(`${item.name}: сонголт олдсонгүй.`, 422);
      return opt;
    });
    // Нэг бүлгээс зөвхөн нэг сонголт
    const groups = new Set<string>();
    for (const o of chosen) {
      if (o.kind === "OPTION" && o.groupName) {
        if (groups.has(o.groupName)) throw new AppError(`${item.name}: ${o.groupName} хэсгээс нэгийг сонгоно уу.`, 422);
        groups.add(o.groupName);
      }
    }
    const removed = line.removed.filter((r) => item.ingredients.includes(r));
    const unitPrice = item.price + chosen.reduce((s, o) => s + o.priceDelta, 0);
    const lineTotal = unitPrice * line.quantity;
    subtotal += lineTotal;
    const snapshot: OptionSnapshot[] = chosen.map((o) => ({ name: o.name, priceDelta: o.priceDelta, kind: o.kind }));
    return {
      menuItem: { connect: { id: item.id } },
      name: item.name,
      unitPrice,
      quantity: line.quantity,
      options: snapshot,
      removed,
      note: line.note || null,
      lineTotal,
    };
  });

  const serviceFee = input.type === "DINE_IN" ? Math.round((subtotal * restaurant.serviceFeePercent) / 100) : 0;
  const deliveryFee = input.type === "DELIVERY" ? restaurant.deliveryFee : 0;
  const total = subtotal + serviceFee + deliveryFee;
  const publicToken = crypto.randomBytes(16).toString("base64url");
  const method: PaymentMethod = input.paymentMethod;

  const order = await db.$transaction(async (tx) => {
    const seq = await tx.restaurant.update({
      where: { id: restaurant.id },
      data: { orderSeq: { increment: 1 } },
      select: { orderSeq: true },
    });

    let customerId: string | null = null;
    if (input.customerPhone) {
      const customer = await tx.customer.upsert({
        where: { restaurantId_phone: { restaurantId: restaurant.id, phone: input.customerPhone } },
        create: {
          restaurantId: restaurant.id,
          phone: input.customerPhone,
          name: input.customerName || "Зочин",
          userId: userId ?? null,
        },
        update: {
          ...(input.customerName ? { name: input.customerName } : {}),
          ...(userId ? { userId } : {}),
        },
      });
      customerId = customer.id;
    }

    const created = await tx.order.create({
      data: {
        restaurantId: restaurant.id,
        number: seq.orderSeq,
        publicToken,
        type: input.type,
        tableId,
        customerId,
        userId: userId ?? null,
        customerName: input.customerName || null,
        customerPhone: input.customerPhone || null,
        deliveryAddress: input.type === "DELIVERY" ? input.deliveryAddress : null,
        note: input.note || null,
        subtotal,
        serviceFee,
        deliveryFee,
        total,
        items: { create: lines },
      },
    });

    if (tableId) {
      const table = await tx.table.findUniqueOrThrow({ where: { id: tableId } });
      await tx.table.update({
        where: { id: tableId },
        data: {
          status: "ORDERED",
          occupiedAt: table.occupiedAt ?? new Date(),
          guestName: table.guestName ?? input.customerName ?? null,
        },
      });
    }
    return created;
  });

  // Төлбөрийн хүсэлт
  const provider = resolveProvider(method);
  const intent = await provider.createIntent({
    orderId: order.id,
    orderNumber: order.number,
    amount: total,
    restaurantName: restaurant.name,
  });
  await db.payment.create({
    data: {
      restaurantId: restaurant.id,
      orderId: order.id,
      amount: total,
      method,
      status: intent.status,
      provider: provider.id,
      providerRef: intent.providerRef,
      paidAt: intent.status === "PAID" ? new Date() : null,
    },
  });
  if (intent.status === "PAID") await applyPaidOrder(order.id);

  await refreshAnalyticsDay(restaurant.id, order.createdAt);
  return { number: order.number, publicToken: order.publicToken, total };
}

/** Төлбөр төлөгдсөнөөр захиалга, үйлчлүүлэгчийн статистикийг шинэчилнэ */
async function applyPaidOrder(orderId: string) {
  const order = await db.order.update({ where: { id: orderId }, data: { isPaid: true } });
  if (order.customerId) {
    await db.customer.update({
      where: { id: order.customerId },
      data: { visits: { increment: 1 }, totalSpent: { increment: order.total }, lastVisitAt: new Date() },
    });
  }
}

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: ["CONFIRMED", "PREPARING", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED", "NEW"],
  PREPARING: ["READY", "CANCELLED", "CONFIRMED"],
  READY: ["DELIVERED", "PREPARING", "CANCELLED"],
  DELIVERED: ["READY"],
  CANCELLED: ["NEW"],
};

export async function updateOrderStatus(restaurantId: string, orderId: string, status: OrderStatus, reason?: string) {
  const order = await db.order.findFirst({ where: { id: orderId, restaurantId } });
  if (!order) throw new AppError(MESSAGES.notFound, 404);
  if (order.status === status) return order;
  if (!ALLOWED_TRANSITIONS[order.status].includes(status)) {
    throw new AppError("Захиалгын төлвийг ийм дарааллаар өөрчлөх боломжгүй.", 409);
  }
  const now = new Date();
  const stamps: Prisma.OrderUpdateInput = {};
  if (status === "CONFIRMED") stamps.confirmedAt = order.confirmedAt ?? now;
  if (status === "PREPARING") {
    stamps.startedAt = now;
    stamps.confirmedAt = order.confirmedAt ?? now;
  }
  if (status === "READY") stamps.readyAt = now;
  if (status === "DELIVERED") stamps.deliveredAt = now;
  if (status === "CANCELLED") {
    stamps.cancelledAt = now;
    stamps.cancelReason = reason || null;
  }
  const updated = await db.order.update({ where: { id: order.id }, data: { status, ...stamps } });

  // Ширээн дээрх бүх захиалга хүргэгдсэн бол төлбөр хүлээж буй төлөвт оруулна
  if (order.tableId && (status === "DELIVERED" || status === "CANCELLED")) {
    await syncTableAfterOrders(order.tableId);
  }
  if (status === "CANCELLED" || order.status === "CANCELLED") await refreshAnalyticsDay(restaurantId, order.createdAt);
  return updated;
}

async function syncTableAfterOrders(tableId: string) {
  const open = await db.order.findMany({
    where: { tableId, status: { not: "CANCELLED" }, isPaid: false },
    select: { status: true },
  });
  const table = await db.table.findUnique({ where: { id: tableId } });
  if (!table) return;
  if (open.length === 0) {
    if (table.status === "ORDERED") await db.table.update({ where: { id: tableId }, data: { status: "SEATED" } });
    return;
  }
  if (open.every((o) => o.status === "DELIVERED")) {
    await db.table.update({ where: { id: tableId }, data: { status: "AWAITING_PAYMENT" } });
  }
}

/** Ажилтан төлбөр хүлээн авах */
export async function markOrderPaid(restaurantId: string, orderId: string, method: PaymentMethod) {
  const order = await db.order.findFirst({ where: { id: orderId, restaurantId }, include: { payments: true } });
  if (!order) throw new AppError(MESSAGES.notFound, 404);
  if (order.isPaid) return order;
  if (order.status === "CANCELLED") throw new AppError("Цуцлагдсан захиалгын төлбөрийг авах боломжгүй.", 409);
  const pending = order.payments.find((p) => p.status === "PENDING");
  if (pending) {
    await db.payment.update({ where: { id: pending.id }, data: { status: "PAID", method, paidAt: new Date() } });
  } else {
    await db.payment.create({
      data: { restaurantId, orderId, amount: order.total, method, status: "PAID", provider: "counter", paidAt: new Date() },
    });
  }
  await applyPaidOrder(order.id);
  if (order.tableId) await syncTableAfterOrders(order.tableId);
  return db.order.findUniqueOrThrow({ where: { id: order.id } });
}

const orderInclude = {
  items: { select: { id: true, name: true, quantity: true, unitPrice: true, lineTotal: true, options: true, removed: true, note: true } },
  table: { select: { number: true } },
} satisfies Prisma.OrderInclude;

export type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export function serializeOrder(o: OrderWithItems) {
  return {
    id: o.id,
    number: o.number,
    type: o.type,
    status: o.status,
    isPaid: o.isPaid,
    table: o.table?.number ?? null,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    deliveryAddress: o.deliveryAddress,
    note: o.note,
    subtotal: o.subtotal,
    serviceFee: o.serviceFee,
    deliveryFee: o.deliveryFee,
    total: o.total,
    createdAt: o.createdAt.toISOString(),
    confirmedAt: o.confirmedAt?.toISOString() ?? null,
    startedAt: o.startedAt?.toISOString() ?? null,
    readyAt: o.readyAt?.toISOString() ?? null,
    deliveredAt: o.deliveredAt?.toISOString() ?? null,
    cancelledAt: o.cancelledAt?.toISOString() ?? null,
    items: o.items.map((i) => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
      options: (i.options as OptionSnapshot[]) ?? [],
      removed: i.removed,
      note: i.note,
    })),
  };
}

export type OrderDTO = ReturnType<typeof serializeOrder>;

export type OrderFilter = "active" | "today" | "all" | OrderStatus;

export async function listOrders(restaurantId: string, filter: OrderFilter = "active", take = 100) {
  const where: Prisma.OrderWhereInput = { restaurantId };
  if (filter === "active") where.status = { in: ACTIVE_STATUSES };
  else if (filter === "today") where.createdAt = { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) };
  else if (filter !== "all") where.status = filter;
  const orders = await db.order.findMany({
    where,
    include: orderInclude,
    orderBy: { createdAt: filter === "active" ? "asc" : "desc" },
    take,
  });
  return orders.map(serializeOrder);
}

/** Гал тогооны дэлгэц: идэвхтэй болон сүүлийн 30 минутад бэлэн болсон захиалга */
export async function listKitchenOrders(restaurantId: string) {
  const since = new Date(Date.now() - 30 * 60 * 1000);
  const orders = await db.order.findMany({
    where: {
      restaurantId,
      OR: [{ status: { in: ["NEW", "CONFIRMED", "PREPARING"] } }, { status: "READY", readyAt: { gte: since } }],
    },
    include: orderInclude,
    orderBy: { createdAt: "asc" },
    take: 80,
  });
  return orders.map(serializeOrder);
}

/** Үйлчлүүлэгчийн захиалгын төлөв (нууц токеноор) */
export async function getPublicOrder(token: string) {
  const order = await db.order.findUnique({
    where: { publicToken: token },
    include: { ...orderInclude, restaurant: { select: { name: true, slug: true, phone: true, brandColor: true } } },
  });
  if (!order) return null;
  return { ...serializeOrder(order), restaurant: order.restaurant };
}

export type PublicOrderDTO = NonNullable<Awaited<ReturnType<typeof getPublicOrder>>>;
