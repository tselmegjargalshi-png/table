import { handle, ok, parseJson } from "@/lib/api";
import { MANAGER_ROLES, requireStaffApi } from "@/lib/auth/guard";
import { deleteCategory, updateCategory } from "@/server/services/menu";
import { categorySchema } from "@/server/validation/schemas";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = handle(async (req, { params }: Ctx) => {
  const { id } = await params;
  const { restaurant } = await requireStaffApi(MANAGER_ROLES);
  return ok(await updateCategory(restaurant.id, id, await parseJson(req, categorySchema)));
});

export const DELETE = handle(async (_req, { params }: Ctx) => {
  const { id } = await params;
  const { restaurant } = await requireStaffApi(MANAGER_ROLES);
  await deleteCategory(restaurant.id, id);
  return ok({ id });
});
