import { handle, ok, parseJson } from "@/lib/api";
import { MANAGER_ROLES, requireStaffApi } from "@/lib/auth/guard";
import { reorderCategories } from "@/server/services/menu";
import { reorderSchema } from "@/server/validation/schemas";

export const POST = handle(async (req) => {
  const { restaurant } = await requireStaffApi(MANAGER_ROLES);
  await reorderCategories(restaurant.id, (await parseJson(req, reorderSchema)).ids);
  return ok({});
});
