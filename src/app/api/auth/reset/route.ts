import crypto from "node:crypto";
import { handle, ok, parseJson } from "@/lib/api";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { resetSchema } from "@/server/validation/schemas";

export const POST = handle(async (req) => {
  const { token, password } = await parseJson(req, resetSchema);
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new AppError("Холбоосын хугацаа дууссан эсвэл аль хэдийн ашиглагдсан байна. Шинээр хүсэлт илгээнэ үү.", 410);
  }
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(password) } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Бусад бүх төхөөрөмж дээрх нэвтрэлтийг хүчингүй болгоно
    db.session.deleteMany({ where: { userId: record.userId } }),
  ]);
  await createSession(record.userId);
  return ok({ redirect: "/login?reset=1" });
});
