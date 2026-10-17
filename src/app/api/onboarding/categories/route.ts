import { handle, ok, parseJson } from "@/lib/api";
import { requireStaffApi } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { getActiveMenu } from "@/server/services/menu";
import { onboardingCategoriesSchema } from "@/server/validation/schemas";

/** 3-р алхам: ангилал үүсгэх. Давхардсан нэрийг алгасна. */
export const POST = handle(async (req) => {
  const { restaurant } = await requireStaffApi(["OWNER", "MANAGER"]);
  const { categories } = await parseJson(req, onboardingCategoriesSchema);
  const menu = await getActiveMenu(restaurant.id);
  const existing = await db.menuCategory.findMany({ where: { restaurantId: restaurant.id } });
  const names = new Set(existing.map((c) => c.name.toLowerCase()));
  let position = existing.length;
  for (const name of categories) {
    if (names.has(name.toLowerCase())) continue;
    names.add(name.toLowerCase());
    await db.menuCategory.create({ data: { restaurantId: restaurant.id, menuId: menu.id, name, position: position++ } });
  }
  await db.restaurant.update({ where: { id: restaurant.id }, data: { onboardingStep: Math.max(3, restaurant.onboardingStep) } });
  const all = await db.menuCategory.findMany({ where: { restaurantId: restaurant.id }, orderBy: { position: "asc" }, select: { id: true, name: true } });
  return ok(all);
});
