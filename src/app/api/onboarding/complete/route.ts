import { handle, ok } from "@/lib/api";
import { requireStaffApi } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { ensureRestaurantQr } from "@/server/services/qr";

export const POST = handle(async () => {
  const { restaurant } = await requireStaffApi(["OWNER", "MANAGER"]);
  const items = await db.menuItem.count({ where: { restaurantId: restaurant.id } });
  if (items === 0) throw new AppError("Хамгийн багадаа нэг бүтээгдэхүүн нэмсний дараа дуусгах боломжтой.", 422);
  await ensureRestaurantQr(restaurant.id);
  await db.restaurant.update({ where: { id: restaurant.id }, data: { onboardingStep: 7 } });
  return ok({ slug: restaurant.slug });
});
