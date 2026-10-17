import { db } from "@/lib/db";
import { seedDemo } from "@/server/demo/seed-demo";

export const maxDuration = 60;

/** Демо ресторанг өдөр бүр анхны төлөвт нь оруулна (Vercel Cron). */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "Эрхгүй хүсэлт." }, { status: 401 });
  }
  const result = await seedDemo(db);
  return Response.json({ ok: true, data: result });
}
