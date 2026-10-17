import { handle, ok } from "@/lib/api";
import { requireStaffApi } from "@/lib/auth/guard";
import { getDashboardData } from "@/server/services/analytics";
import { tickDemo } from "@/server/services/demo";

export const GET = handle(async () => {
  const { restaurant } = await requireStaffApi();
  await tickDemo(restaurant);
  return ok(await getDashboardData(restaurant.id));
});
