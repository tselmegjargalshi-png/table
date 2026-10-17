import { handle, ok, parseJson } from "@/lib/api";
import { requireStaffApi } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { ensureRestaurantQr, ensureTableQr } from "@/server/services/qr";
import { onboardingTablesSchema } from "@/server/validation/schemas";

/** 5-р алхам: ширээ үүсгэх. Сүлжээн байрлалаар автоматаар зохион байгуулна. */
export const POST = handle(async (req) => {
  const { restaurant } = await requireStaffApi(["OWNER", "MANAGER"]);
  const { count, seats } = await parseJson(req, onboardingTablesSchema);
  const existing = await db.table.count({ where: { restaurantId: restaurant.id } });
  const cols = Math.min(6, Math.max(2, Math.ceil(Math.sqrt(count))));
  for (let n = existing + 1; n <= count; n++) {
    const i = n - 1;
    const rows = Math.ceil(count / cols);
    const t = await db.table.create({
      data: {
        restaurantId: restaurant.id,
        number: n,
        seats,
        shape: seats > 4 ? "RECT" : "SQUARE",
        posX: Math.round(10 + ((i % cols) * 80) / Math.max(cols - 1, 1)),
        posY: Math.round(14 + (Math.floor(i / cols) * 72) / Math.max(rows - 1, 1)),
      },
    });
    await ensureTableQr(restaurant.id, t.id);
  }
  await ensureRestaurantQr(restaurant.id);
  await db.restaurant.update({ where: { id: restaurant.id }, data: { onboardingStep: Math.max(5, restaurant.onboardingStep) } });
  return ok({ count: Math.max(existing, count) });
});
