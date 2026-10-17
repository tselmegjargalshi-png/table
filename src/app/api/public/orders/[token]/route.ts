import { fail, handle, ok } from "@/lib/api";
import { getPublicOrder } from "@/server/services/orders";

export const GET = handle(async (_req, { params }: { params: Promise<{ token: string }> }) => {
  const { token } = await params;
  const order = await getPublicOrder(token);
  if (!order) return fail("Захиалга олдсонгүй.", 404);
  return ok(order);
});
