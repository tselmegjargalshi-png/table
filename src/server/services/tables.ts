import "server-only";
import type { TableStatus } from "@prisma/client";
import type { z } from "zod";
import { db } from "@/lib/db";
import { AppError, MESSAGES } from "@/lib/errors";
import { startOfUbDay } from "@/lib/format";
import type { tableSchema } from "@/server/validation/schemas";
import { ensureTableQr } from "./qr";
import { markOrderPaid } from "./orders";

export async function listTables(restaurantId: string) {
  const now = new Date();
  const tables = await db.table.findMany({
    where: { restaurantId },
    orderBy: { number: "asc" },
    include: {
      orders: {
        where: { status: { not: "CANCELLED" }, isPaid: false },
        orderBy: { createdAt: "asc" },
        include: { items: { select: { name: true, quantity: true, lineTotal: true } } },
      },
      reservations: {
        where: {
          status: { in: ["PENDING", "CONFIRMED"] },
          startsAt: { gte: new Date(now.getTime() - 60 * 60 * 1000), lt: startOfUbDay(now, 1) },
        },
        orderBy: { startsAt: "asc" },
        take: 1,
      },
    },
  });
  return tables.map((t) => ({
    id: t.id,
    number: t.number,
    seats: t.seats,
    zone: t.zone,
    shape: t.shape,
    posX: t.posX,
    posY: t.posY,
    status: t.status,
    occupiedAt: t.occupiedAt?.toISOString() ?? null,
    guestName: t.guestName,
    orderTotal: t.orders.reduce((s, o) => s + o.total, 0),
    orders: t.orders.map((o) => ({
      id: o.id,
      number: o.number,
      status: o.status,
      total: o.total,
      createdAt: o.createdAt.toISOString(),
      items: o.items,
    })),
    nextReservation: t.reservations[0]
      ? {
          id: t.reservations[0].id,
          name: t.reservations[0].name,
          partySize: t.reservations[0].partySize,
          startsAt: t.reservations[0].startsAt.toISOString(),
        }
      : null,
  }));
}

export type TableDTO = Awaited<ReturnType<typeof listTables>>[number];

export async function createTable(restaurantId: string, input: z.infer<typeof tableSchema>) {
  const exists = await db.table.findUnique({ where: { restaurantId_number: { restaurantId, number: input.number } } });
  if (exists) throw new AppError(`${input.number} дугаартай ширээ бүртгэлтэй байна.`, 409);
  const table = await db.table.create({ data: { ...input, restaurantId } });
  await ensureTableQr(restaurantId, table.id);
  return table;
}

export async function updateTable(restaurantId: string, id: string, input: z.infer<typeof tableSchema>) {
  const table = await db.table.findFirst({ where: { id, restaurantId } });
  if (!table) throw new AppError(MESSAGES.notFound, 404);
  if (input.number !== table.number) {
    const clash = await db.table.findUnique({ where: { restaurantId_number: { restaurantId, number: input.number } } });
    if (clash) throw new AppError(`${input.number} дугаартай ширээ бүртгэлтэй байна.`, 409);
  }
  return db.table.update({ where: { id }, data: input });
}

export async function deleteTable(restaurantId: string, id: string) {
  const table = await db.table.findFirst({ where: { id, restaurantId } });
  if (!table) throw new AppError(MESSAGES.notFound, 404);
  if (table.status !== "FREE") throw new AppError("Сул биш ширээг устгах боломжгүй.", 409);
  await db.table.delete({ where: { id } });
}

export async function setTableStatus(restaurantId: string, id: string, status: TableStatus, guestName?: string | null) {
  const table = await db.table.findFirst({ where: { id, restaurantId } });
  if (!table) throw new AppError(MESSAGES.notFound, 404);
  const occupied = status === "SEATED" || status === "ORDERED" || status === "AWAITING_PAYMENT";
  return db.table.update({
    where: { id },
    data: {
      status,
      occupiedAt: occupied ? (table.occupiedAt ?? new Date()) : null,
      guestName: status === "FREE" ? null : (guestName ?? table.guestName),
    },
  });
}

/** Төлбөр хааж ширээг чөлөөлөх */
export async function closeTable(restaurantId: string, id: string, method: "CASH" | "CARD" | "QPAY") {
  const table = await db.table.findFirst({
    where: { id, restaurantId },
    include: { orders: { where: { status: { not: "CANCELLED" }, isPaid: false } } },
  });
  if (!table) throw new AppError(MESSAGES.notFound, 404);
  const unfinished = table.orders.filter((o) => o.status !== "DELIVERED");
  if (unfinished.length > 0) {
    throw new AppError("Хүргэгдээгүй захиалга байна. Бүх захиалгыг хүргэсний дараа төлбөрөө хаана уу.", 409);
  }
  for (const o of table.orders) await markOrderPaid(restaurantId, o.id, method);
  return db.table.update({ where: { id }, data: { status: "FREE", occupiedAt: null, guestName: null } });
}
