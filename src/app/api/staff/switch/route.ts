import { z } from "zod";
import { handle, ok, parseJson } from "@/lib/api";
import { setActiveRestaurant } from "@/lib/auth/session";
import { requireUserApi } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { AppError, MESSAGES } from "@/lib/errors";

export const POST = handle(async (req) => {
  const user = await requireUserApi();
  const { restaurantId } = await parseJson(req, z.object({ restaurantId: z.string() }));
  const m = await db.restaurantStaff.findUnique({ where: { restaurantId_userId: { restaurantId, userId: user.id } } });
  if (!m) throw new AppError(MESSAGES.forbidden, 403);
  await setActiveRestaurant(restaurantId);
  return ok({});
});
