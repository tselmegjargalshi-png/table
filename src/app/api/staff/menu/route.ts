import { handle, ok } from "@/lib/api";
import { requireStaffApi } from "@/lib/auth/guard";
import { getStaffMenu } from "@/server/services/menu";

export const GET = handle(async () => {
  const { restaurant } = await requireStaffApi();
  return ok(await getStaffMenu(restaurant.id));
});
