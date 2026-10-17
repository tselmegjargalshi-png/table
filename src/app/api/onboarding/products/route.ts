import { handle, ok, parseJson } from "@/lib/api";
import { requireStaffApi } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { onboardingProductsSchema } from "@/server/validation/schemas";

/** 4-р алхам: бүтээгдэхүүн нэмэх */
export const POST = handle(async (req) => {
  const { restaurant } = await requireStaffApi(["OWNER", "MANAGER"]);
  const { products } = await parseJson(req, onboardingProductsSchema);
  const owned = await db.menuCategory.findMany({ where: { restaurantId: restaurant.id }, select: { id: true } });
  const ids = new Set(owned.map((c) => c.id));
  if (products.some((p) => !ids.has(p.categoryId))) throw new AppError("Ангилал олдсонгүй.", 422);
  for (const p of products) {
    const last = await db.menuItem.aggregate({ where: { categoryId: p.categoryId }, _max: { position: true } });
    await db.menuItem.create({
      data: { restaurantId: restaurant.id, categoryId: p.categoryId, name: p.name, price: p.price, description: p.description ?? null, position: (last._max.position ?? -1) + 1 },
    });
  }
  await db.restaurant.update({ where: { id: restaurant.id }, data: { onboardingStep: Math.max(4, restaurant.onboardingStep) } });
  return ok({ count: products.length }, { status: 201 });
});
