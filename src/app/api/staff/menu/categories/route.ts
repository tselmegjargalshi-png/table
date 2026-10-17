import { handle, ok, parseJson } from "@/lib/api";
import { MANAGER_ROLES, requireStaffApi } from "@/lib/auth/guard";
import { createCategory } from "@/server/services/menu";
import { categorySchema } from "@/server/validation/schemas";

export const POST = handle(async (req) => {
  const { restaurant } = await requireStaffApi(MANAGER_ROLES);
  return ok(await createCategory(restaurant.id, await parseJson(req, categorySchema)), { status: 201 });
});
