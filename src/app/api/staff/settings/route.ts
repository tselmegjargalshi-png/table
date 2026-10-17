import { handle, ok, parseJson } from "@/lib/api";
import { MANAGER_ROLES, requireStaffApi } from "@/lib/auth/guard";
import { updateRestaurantSettings } from "@/server/services/restaurants";
import { restaurantSettingsSchema } from "@/server/validation/schemas";

export const PUT = handle(async (req) => {
  const { restaurant } = await requireStaffApi(MANAGER_ROLES);
  const r = await updateRestaurantSettings(restaurant.id, await parseJson(req, restaurantSettingsSchema));
  return ok({ id: r.id });
});
