import { handle, ok, parseJson } from "@/lib/api";
import { requireStaffApi } from "@/lib/auth/guard";
import { updateOrderStatus } from "@/server/services/orders";
import { orderStatusSchema } from "@/server/validation/schemas";

export const PATCH = handle(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { restaurant } = await requireStaffApi();
  const { status, reason } = await parseJson(req, orderStatusSchema);
  const order = await updateOrderStatus(restaurant.id, id, status, reason);
  return ok({ id: order.id, status: order.status });
});
