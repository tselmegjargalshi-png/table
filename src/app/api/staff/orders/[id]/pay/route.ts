import { z } from "zod";
import { handle, ok, parseJson } from "@/lib/api";
import { requireStaffApi } from "@/lib/auth/guard";
import { markOrderPaid } from "@/server/services/orders";

const schema = z.object({ method: z.enum(["CASH", "CARD", "QPAY"]) });

export const POST = handle(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { restaurant } = await requireStaffApi(["OWNER", "MANAGER", "WAITER", "CASHIER"]);
  const { method } = await parseJson(req, schema);
  const order = await markOrderPaid(restaurant.id, id, method);
  return ok({ id: order.id, isPaid: order.isPaid });
});
