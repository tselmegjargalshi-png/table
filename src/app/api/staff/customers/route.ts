import { handle, ok, parseJson } from "@/lib/api";
import { requireStaffApi } from "@/lib/auth/guard";
import { createCustomer, listCustomers, type CustomerSort } from "@/server/services/customers";
import { customerSchema } from "@/server/validation/schemas";

export const GET = handle(async (req) => {
  const { restaurant } = await requireStaffApi();
  const sp = new URL(req.url).searchParams;
  const sort = (["spent", "visits", "recent", "name"].includes(sp.get("sort") ?? "") ? sp.get("sort") : "spent") as CustomerSort;
  return ok(await listCustomers(restaurant.id, sp.get("q") ?? "", sort));
});

export const POST = handle(async (req) => {
  const { restaurant } = await requireStaffApi();
  const c = await createCustomer(restaurant.id, await parseJson(req, customerSchema));
  return ok({ id: c.id }, { status: 201 });
});
