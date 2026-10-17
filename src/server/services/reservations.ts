import "server-only";
import type { ReservationStatus } from "@prisma/client";
import type { z } from "zod";
import { db } from "@/lib/db";
import { AppError, MESSAGES } from "@/lib/errors";
import { startOfUbDay } from "@/lib/format";
import type { publicReservationSchema, reservationSchema } from "@/server/validation/schemas";

export type ReservationRange = "today" | "tomorrow" | "week";

function rangeBounds(range: ReservationRange) {
  const now = new Date();
  if (range === "today") return { gte: startOfUbDay(now), lt: startOfUbDay(now, 1) };
  if (range === "tomorrow") return { gte: startOfUbDay(now, 1), lt: startOfUbDay(now, 2) };
  return { gte: startOfUbDay(now), lt: startOfUbDay(now, 7) };
}

export async function listReservations(restaurantId: string, range: ReservationRange) {
  const rows = await db.reservation.findMany({
    where: { restaurantId, startsAt: rangeBounds(range) },
    orderBy: { startsAt: "asc" },
    include: { table: { select: { id: true, number: true, seats: true } }, customer: { select: { visits: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    partySize: r.partySize,
    startsAt: r.startsAt.toISOString(),
    durationMin: r.durationMin,
    status: r.status,
    note: r.note,
    source: r.source,
    table: r.table,
    visits: r.customer?.visits ?? 0,
  }));
}

export type ReservationDTO = Awaited<ReturnType<typeof listReservations>>[number];

export async function reservationCounts(restaurantId: string) {
  const [today, tomorrow, week] = await Promise.all(
    (["today", "tomorrow", "week"] as const).map((r) =>
      db.reservation.count({ where: { restaurantId, startsAt: rangeBounds(r), status: { not: "CANCELLED" } } }),
    ),
  );
  return { today, tomorrow, week };
}

async function assertTable(restaurantId: string, tableId?: string | null) {
  if (!tableId) return null;
  const t = await db.table.findFirst({ where: { id: tableId, restaurantId } });
  if (!t) throw new AppError("Ширээ олдсонгүй.", 422);
  return t;
}

async function linkCustomer(restaurantId: string, name: string, phone: string) {
  const c = await db.customer.upsert({
    where: { restaurantId_phone: { restaurantId, phone } },
    create: { restaurantId, name, phone },
    update: {},
  });
  return c.id;
}

/** Тухайн ширээнд давхцах захиалга байгаа эсэхийг шалгана */
async function assertNoOverlap(restaurantId: string, tableId: string, startsAt: Date, durationMin: number, excludeId?: string) {
  const end = new Date(startsAt.getTime() + durationMin * 60000);
  const sameDay = await db.reservation.findMany({
    where: {
      restaurantId,
      tableId,
      status: { in: ["PENDING", "CONFIRMED", "ARRIVED"] },
      id: excludeId ? { not: excludeId } : undefined,
      startsAt: { gte: new Date(startsAt.getTime() - 6 * 3600000), lt: end },
    },
  });
  const clash = sameDay.find((r) => new Date(r.startsAt.getTime() + r.durationMin * 60000) > startsAt);
  if (clash) throw new AppError("Энэ ширээ тухайн цагт өөр захиалгатай байна.", 409);
}

export async function createReservation(restaurantId: string, input: z.infer<typeof reservationSchema>, source = "staff") {
  const table = await assertTable(restaurantId, input.tableId);
  if (table && table.seats < input.partySize) {
    throw new AppError(`Ширээ ${table.number} нь ${table.seats} хүний суудалтай. Илүү том ширээ сонгоно уу.`, 422);
  }
  if (table) await assertNoOverlap(restaurantId, table.id, input.startsAt, input.durationMin);
  const customerId = await linkCustomer(restaurantId, input.name, input.phone);
  return db.reservation.create({
    data: {
      restaurantId,
      customerId,
      name: input.name,
      phone: input.phone,
      partySize: input.partySize,
      startsAt: input.startsAt,
      durationMin: input.durationMin,
      tableId: table?.id ?? null,
      note: input.note ?? null,
      status: table ? "CONFIRMED" : "PENDING",
      source,
    },
  });
}

export async function createPublicReservation(slug: string, input: z.infer<typeof publicReservationSchema>) {
  const restaurant = await db.restaurant.findUnique({ where: { slug } });
  if (!restaurant) throw new AppError("Ресторан олдсонгүй.", 404);
  if (input.startsAt.getTime() < Date.now() + 15 * 60000) {
    throw new AppError("Захиалгын цагийг одоогоос хамгийн багадаа 15 минутын дараа сонгоно уу.", 422);
  }
  const r = await createReservation(restaurant.id, { ...input, durationMin: 90, tableId: null }, "online");
  return { id: r.id, startsAt: r.startsAt.toISOString(), partySize: r.partySize };
}

export async function updateReservation(restaurantId: string, id: string, input: z.infer<typeof reservationSchema>) {
  const r = await db.reservation.findFirst({ where: { id, restaurantId } });
  if (!r) throw new AppError(MESSAGES.notFound, 404);
  const table = await assertTable(restaurantId, input.tableId);
  if (table) await assertNoOverlap(restaurantId, table.id, input.startsAt, input.durationMin, id);
  return db.reservation.update({
    where: { id },
    data: { ...input, tableId: table?.id ?? null },
  });
}

export async function setReservationStatus(
  restaurantId: string,
  id: string,
  status: ReservationStatus,
  tableId?: string | null,
) {
  const r = await db.reservation.findFirst({ where: { id, restaurantId } });
  if (!r) throw new AppError(MESSAGES.notFound, 404);
  const table = tableId !== undefined ? await assertTable(restaurantId, tableId) : null;
  const finalTableId = tableId !== undefined ? (table?.id ?? null) : r.tableId;

  const updated = await db.reservation.update({ where: { id }, data: { status, tableId: finalTableId } });

  // Ирсэн үед ширээг "Суусан" болгоно, баталгаажсан бол "Захиалгатай"
  if (finalTableId) {
    const t = await db.table.findUnique({ where: { id: finalTableId } });
    if (t) {
      if (status === "ARRIVED") {
        await db.table.update({
          where: { id: t.id },
          data: { status: t.status === "ORDERED" ? t.status : "SEATED", occupiedAt: t.occupiedAt ?? new Date(), guestName: r.name },
        });
      } else if (status === "CONFIRMED" && t.status === "FREE") {
        const soon = r.startsAt.getTime() - Date.now() < 2 * 3600000;
        if (soon) await db.table.update({ where: { id: t.id }, data: { status: "RESERVED", guestName: r.name } });
      } else if (status === "CANCELLED" && t.status === "RESERVED") {
        await db.table.update({ where: { id: t.id }, data: { status: "FREE", guestName: null } });
      }
    }
  }
  return updated;
}

export async function deleteReservation(restaurantId: string, id: string) {
  const r = await db.reservation.findFirst({ where: { id, restaurantId } });
  if (!r) throw new AppError(MESSAGES.notFound, 404);
  await db.reservation.delete({ where: { id } });
}
