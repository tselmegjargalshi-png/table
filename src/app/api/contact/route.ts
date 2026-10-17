import { clientIp, handle, ok, parseJson, rateLimit } from "@/lib/api";
import { db } from "@/lib/db";
import { contactSchema } from "@/server/validation/schemas";

export const POST = handle(async (req) => {
  rateLimit(`contact:${clientIp(req)}`, 4, 60_000);
  const input = await parseJson(req, contactSchema);
  await db.contactRequest.create({
    data: { name: input.name, phone: input.phone, email: input.email ?? null, restaurant: input.restaurant || null, message: input.message || null },
  });
  return ok({}, { status: 201 });
});
