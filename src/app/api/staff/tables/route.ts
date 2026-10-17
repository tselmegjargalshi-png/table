import { handle, ok, parseJson } from "@/lib/api";
import { MANAGER_ROLES, requireStaffApi } from "@/lib/auth/guard";
import { tickDemo } from "@/server/services/demo";
import { createTable, listTables } from "@/server/services/tables";
import { tableSchema } from "@/server/validation/schemas";

export const GET = handle(async () => {
  const { restaurant } = await requireStaffApi();
  await tickDemo(restaurant);
  return ok(await listTables(restaurant.id));
});

export const POST = handle(async (req) => {
  const { restaurant } = await requireStaffApi(MANAGER_ROLES);
  const input = await parseJson(req, tableSchema);
  return ok(await createTable(restaurant.id, input), { status: 201 });
});
