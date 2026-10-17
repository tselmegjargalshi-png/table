import "server-only";

/**
 * Имэйл илгээх абстракц. RESEND_API_KEY тохируулсан бол Resend-ээр илгээнэ.
 * Тохируулаагүй үед зөвхөн серверийн логт бичнэ.
 */
export async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "TABLE.MN <no-reply@table.mn>";
  if (!key) {
    console.info(`[mail] ${to} | ${subject}\n${text}`);
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, text }),
  });
  if (!res.ok) console.error("[mail] илгээж чадсангүй", res.status, await res.text());
  return res.ok;
}
