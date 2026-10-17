import "server-only";
import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { db } from "@/lib/db";
import { AppError, MESSAGES } from "@/lib/errors";
import type { customerSchema } from "@/server/validation/schemas";

export type CustomerSort = "spent" | "visits" | "recent" | "name";

export async function listCustomers(restaurantId: string, q = "", sort: CustomerSort = "spent") {
  const where: Prisma.CustomerWhereInput = { restaurantId };
  if (q.trim()) {
    const term = q.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { phone: { contains: term.replace(/\s/g, "") } },
    ];
  }
  const orderBy: Prisma.CustomerOrderByWithRelationInput =
    sort === "visits" ? { visits: "desc" } : sort === "recent" ? { lastVisitAt: { sort: "desc", nulls: "last" } } : sort === "name" ? { name: "asc" } : { totalSpent: "desc" };

  const customers = await db.customer.findMany({ where, orderBy, take: 200 });
  const favorites = await favoriteItems(customers.map((c) => c.id));
  return customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    visits: c.visits,
    totalSpent: c.totalSpent,
    lastVisitAt: c.lastVisitAt?.toISOString() ?? null,
    favorites: favorites.get(c.id) ?? [],
  }));
}

export type CustomerDTO = Awaited<ReturnType<typeof listCustomers>>[number];

async function favoriteItems(customerIds: string[], take = 3) {
  const map = new Map<string, string[]>();
  if (customerIds.length === 0) return map;
  const rows = await db.$queryRaw<Array<{ customerId: string; name: string; qty: bigint }>>`
    SELECT o."customerId" AS "customerId", oi."name" AS name, SUM(oi."quantity") AS qty
    FROM "OrderItem" oi JOIN "Order" o ON o."id" = oi."orderId"
    WHERE o."customerId" = ANY(${customerIds}) AND o."status" <> 'CANCELLED'
    GROUP BY 1, 2
    ORDER BY 1, qty DESC`;
  for (const r of rows) {
    const list = map.get(r.customerId) ?? [];
    if (list.length < take) list.push(r.name);
    map.set(r.customerId, list);
  }
  return map;
}

export async function getCustomer(restaurantId: string, id: string) {
  const c = await db.customer.findFirst({
    where: { id, restaurantId },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { items: { select: { name: true, quantity: true } }, table: { select: { number: true } } },
      },
      reservations: { orderBy: { startsAt: "desc" }, take: 10 },
      reviews: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
  if (!c) return null;
  const favs = await favoriteItems([c.id], 5);
  const avg = c.visits ? Math.round(c.totalSpent / c.visits) : 0;
  return { ...c, favorites: favs.get(c.id) ?? [], avgOrder: avg };
}

export async function updateCustomer(restaurantId: string, id: string, input: z.infer<typeof customerSchema>) {
  const c = await db.customer.findFirst({ where: { id, restaurantId } });
  if (!c) throw new AppError(MESSAGES.notFound, 404);
  if (input.phone !== c.phone) {
    const clash = await db.customer.findUnique({ where: { restaurantId_phone: { restaurantId, phone: input.phone } } });
    if (clash) throw new AppError("Энэ утасны дугаартай үйлчлүүлэгч бүртгэлтэй байна.", 409);
  }
  return db.customer.update({ where: { id }, data: { ...input, email: input.email || null } });
}

export async function createCustomer(restaurantId: string, input: z.infer<typeof customerSchema>) {
  const clash = await db.customer.findUnique({ where: { restaurantId_phone: { restaurantId, phone: input.phone } } });
  if (clash) throw new AppError("Энэ утасны дугаартай үйлчлүүлэгч бүртгэлтэй байна.", 409);
  return db.customer.create({ data: { ...input, email: input.email || null, restaurantId } });
}

export async function customerStats(restaurantId: string) {
  const since = new Date(Date.now() - 30 * 24 * 3600000);
  const [total, returning, recent] = await Promise.all([
    db.customer.count({ where: { restaurantId } }),
    db.customer.count({ where: { restaurantId, visits: { gte: 2 } } }),
    db.customer.count({ where: { restaurantId, lastVisitAt: { gte: since } } }),
  ]);
  return { total, returning, recent };
}
