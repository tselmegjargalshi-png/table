import { handle, ok } from "@/lib/api";
import { requireStaffApi } from "@/lib/auth/guard";
import { tickDemo } from "@/server/services/demo";
import { listKitchenOrders } from "@/server/services/orders";

export const GET = handle(async () => {
  const { restaurant } = await requireStaffApi();
  await tickDemo(restaurant);
  return ok(await listKitchenOrders(restaurant.id));
});
