import { clientIp, handle, ok, parseJson, rateLimit } from "@/lib/api";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { loginSchema } from "@/server/validation/schemas";

export const POST = handle(async (req) => {
  rateLimit(`login:${clientIp(req)}`, 10, 60_000);
  const { email, password } = await parseJson(req, loginSchema);
  const user = await db.user.findUnique({
    where: { email },
    include: { staff: { select: { role: true }, take: 1 } },
  });
  // Хэрэглэгч байгаа эсэхийг задруулахгүйн тулд нэг ижил мессеж
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new AppError("Имэйл эсвэл нууц үг буруу байна.", 401);
  }
  await createSession(user.id);
  const role = user.staff[0]?.role;
  const redirect = !role ? (user.role === "CUSTOMER" ? "/account" : "/onboarding") : role === "KITCHEN" ? "/kitchen" : "/app";
  return ok({ redirect });
});
