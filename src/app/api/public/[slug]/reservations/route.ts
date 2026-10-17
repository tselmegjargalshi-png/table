import { clientIp, handle, ok, parseJson, rateLimit } from "@/lib/api";
import { createPublicReservation } from "@/server/services/reservations";
import { publicReservationSchema } from "@/server/validation/schemas";

export const POST = handle(async (req, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  rateLimit(`reserve:${clientIp(req)}`, 5, 60_000);
  const input = await parseJson(req, publicReservationSchema);
  return ok(await createPublicReservation(slug, input), { status: 201 });
});
