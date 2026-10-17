import crypto from "node:crypto";
import { clientIp, handle, ok, parseJson, rateLimit } from "@/lib/api";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/urls";
import { sendMail } from "@/server/services/mail";
import { forgotSchema } from "@/server/validation/schemas";

export const POST = handle(async (req) => {
  rateLimit(`forgot:${clientIp(req)}`, 5, 60_000);
  const { email } = await parseJson(req, forgotSchema);
  const user = await db.user.findUnique({ where: { email } });
  let devLink: string | null = null;
  if (user) {
    const token = crypto.randomBytes(32).toString("base64url");
    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const link = `${appUrl()}/reset-password?token=${token}`;
    const sent = await sendMail(
      email,
      "TABLE.MN: нууц үг сэргээх",
      `Сайн байна уу, ${user.name}.\n\nНууц үгээ шинэчлэхийн тулд дараах холбоосоор орно уу (1 цагийн хугацаатай):\n${link}\n\nХэрэв та энэ хүсэлтийг илгээгээгүй бол энэ имэйлийг үл тоомсорлоно уу.`,
    );
    // Имэйл үйлчилгээ холбогдоогүй хөгжүүлэлтийн орчинд холбоосыг шууд харуулна
    if (!sent && (process.env.NODE_ENV !== "production" || process.env.AUTH_SHOW_RESET_LINK === "true")) devLink = link;
  }
  // Бүртгэлтэй эсэхийг задруулахгүй
  return ok({ devLink });
});
