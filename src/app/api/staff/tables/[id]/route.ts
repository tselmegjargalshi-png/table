import { handle, ok, parseJson } from "@/lib/api";
import { MANAGER_ROLES, requireStaffApi } from "@/lib/auth/guard";
import { deleteTable, setTableStatus, updateTable } from "@/server/services/tables";
import { tableSchema, tableStatusSchema } from "@/server/validation/schemas";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handle(async (req, { params }: Ctx) => {
  const { id } = await params;
  const { restaurant } = await requireStaffApi();
  const { status, guestName } = await parseJson(req, tableStatusSchema);
  return ok(await setTableStatus(restaurant.id, id, status, guestName));
});

export const PUT = handle(async (req, { params }: Ctx) => {
  const { id } = await params;
  const { restaurant } = await requireStaffApi(MANAGER_ROLES);
  const input = await parseJson(req, tableSchema);
  return ok(await updateTable(restaurant.id, id, input));
});

export const DELETE = handle(async (_req, { params }: Ctx) => {
  const { id } = await params;
  const { restaurant } = await requireStaffApi(MANAGER_ROLES);
  await deleteTable(restaurant.id, id);
  return ok({ id });
});
