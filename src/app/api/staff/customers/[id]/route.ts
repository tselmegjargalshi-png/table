import { fail, handle, ok, parseJson } from "@/lib/api";
import { requireStaffApi } from "@/lib/auth/guard";
import { getCustomer, updateCustomer } from "@/server/services/customers";
import { customerSchema } from "@/server/validation/schemas";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (_req, { params }: Ctx) => {
  const { id } = await params;
  const { restaurant } = await requireStaffApi();
  const c = await getCustomer(restaurant.id, id);
  if (!c) return fail("Үйлчлүүлэгч олдсонгүй.", 404);
  return ok({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    notes: c.notes,
    visits: c.visits,
    totalSpent: c.totalSpent,
    avgOrder: c.avgOrder,
    lastVisitAt: c.lastVisitAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    favorites: c.favorites,
    orders: c.orders.map((o) => ({
      id: o.id,
      number: o.number,
      status: o.status,
      total: o.total,
      createdAt: o.createdAt.toISOString(),
      table: o.table?.number ?? null,
      items: o.items.map((i) => `${i.quantity} × ${i.name}`),
    })),
  });
});

export const PUT = handle(async (req, { params }: Ctx) => {
  const { id } = await params;
  const { restaurant } = await requireStaffApi();
  const c = await updateCustomer(restaurant.id, id, await parseJson(req, customerSchema));
  return ok({ id: c.id });
});
