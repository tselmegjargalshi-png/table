import { clientIp, handle, ok, parseJson, rateLimit } from "@/lib/api";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { registerSchema } from "@/server/validation/schemas";

export const POST = handle(async (req) => {
  rateLimit(`register:${clientIp(req)}`, 5, 60_000);
  const input = await parseJson(req, registerSchema);
  const exists = await db.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (exists) throw new AppError("Энэ имэйл хаягаар бүртгэл үүссэн байна. Нэвтэрч орно уу.", 409);
  const user = await db.user.create({
    data: {
      email: input.email,
      name: input.name,
      phone: input.phone ?? null,
      passwordHash: await hashPassword(input.password),
      role: input.accountType === "owner" ? "OWNER" : "CUSTOMER",
    },
  });
  await createSession(user.id);
  return ok({ redirect: input.accountType === "owner" ? "/onboarding" : "/account" }, { status: 201 });
});
