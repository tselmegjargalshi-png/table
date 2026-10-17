import { handle, ok, parseJson } from "@/lib/api";
import { MANAGER_ROLES, requireStaffApi } from "@/lib/auth/guard";
import { deleteMenuItem, patchMenuItem, updateMenuItem } from "@/server/services/menu";
import { menuItemPatchSchema, menuItemSchema } from "@/server/validation/schemas";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = handle(async (req, { params }: Ctx) => {
  const { id } = await params;
  const { restaurant } = await requireStaffApi(MANAGER_ROLES);
  return ok(await updateMenuItem(restaurant.id, id, await parseJson(req, menuItemSchema)));
});

// Үнэ, "Зарагдаж байгаа" төлвийг зөөгч ч өөрчилж болно
export const PATCH = handle(async (req, { params }: Ctx) => {
  const { id } = await params;
  const { restaurant, role } = await requireStaffApi();
  const input = await parseJson(req, menuItemPatchSchema);
  if (input.price !== undefined && role !== "OWNER" && role !== "MANAGER") {
    return ok(await patchMenuItem(restaurant.id, id, { isAvailable: input.isAvailable }));
  }
  return ok(await patchMenuItem(restaurant.id, id, input));
});

export const DELETE = handle(async (_req, { params }: Ctx) => {
  const { id } = await params;
  const { restaurant } = await requireStaffApi(MANAGER_ROLES);
  await deleteMenuItem(restaurant.id, id);
  return ok({ id });
});
