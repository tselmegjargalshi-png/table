import { handle, ok } from "@/lib/api";
import { MANAGER_ROLES, requireStaffApi } from "@/lib/auth/guard";
import { getAnalytics, type AnalyticsRange } from "@/server/services/analytics";
import { tickDemo } from "@/server/services/demo";

export const GET = handle(async (req) => {
  const { restaurant } = await requireStaffApi(MANAGER_ROLES);
  await tickDemo(restaurant);
  const r = Number(new URL(req.url).searchParams.get("range"));
  const range: AnalyticsRange = r === 30 || r === 90 ? r : 7;
  return ok(await getAnalytics(restaurant.id, range));
});
