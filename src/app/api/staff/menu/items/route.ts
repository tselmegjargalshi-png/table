import { handle, ok, parseJson } from "@/lib/api";
import { MANAGER_ROLES, requireStaffApi } from "@/lib/auth/guard";
import { createMenuItem } from "@/server/services/menu";
import { menuItemSchema } from "@/server/validation/schemas";

export const POST = handle(async (req) => {
  const { restaurant } = await requireStaffApi(MANAGER_ROLES);
  return ok(await createMenuItem(restaurant.id, await parseJson(req, menuItemSchema)), { status: 201 });
});
