import { clientIp, handle, ok, parseJson, rateLimit } from "@/lib/api";
import { createSession, setActiveRestaurant } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { DEMO_ACCOUNTS, DEMO_SLUG } from "@/server/demo/constants";
import { z } from "zod";

const schema = z.object({ as: z.enum(["owner", "kitchen", "waiter"]).default("owner") });

/** Демо бүртгэлээр нэг товшилтоор нэвтрэх */
export const POST = handle(async (req) => {
  rateLimit(`demo:${clientIp(req)}`, 20, 60_000);
  const { as } = await parseJson(req, schema);
  const user = await db.user.findUnique({ where: { email: DEMO_ACCOUNTS[as].email } });
  const restaurant = await db.restaurant.findUnique({ where: { slug: DEMO_SLUG } });
  if (!user || !restaurant) throw new AppError("Демо ресторан бэлэн биш байна. Түр хүлээгээд дахин оролдоно уу.", 503);
  await createSession(user.id);
  await setActiveRestaurant(restaurant.id);
  return ok({ redirect: as === "kitchen" ? "/kitchen" : "/app" });
});
