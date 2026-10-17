import { clientIp, handle, ok, parseJson, rateLimit } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/session";
import { placeOrder } from "@/server/services/orders";
import { placeOrderSchema } from "@/server/validation/schemas";

export const POST = handle(async (req, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  rateLimit(`order:${clientIp(req)}`, 12, 60_000);
  const input = await parseJson(req, placeOrderSchema);
  const user = await getCurrentUser();
  const result = await placeOrder(slug, input, user?.id);
  return ok(result, { status: 201 });
});
