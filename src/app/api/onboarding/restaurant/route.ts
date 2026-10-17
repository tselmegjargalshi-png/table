import { handle, ok, parseJson } from "@/lib/api";
import { getStaffContext, requireUserApi } from "@/lib/auth/guard";
import { setActiveRestaurant } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { createRestaurantForOwner, isSlugAvailable } from "@/server/services/restaurants";
import { AppError } from "@/lib/errors";
import { onboardingRestaurantSchema } from "@/server/validation/schemas";

/** 2-р алхам: ресторан үүсгэх эсвэл мэдээллийг нь шинэчлэх */
export const POST = handle(async (req) => {
  const user = await requireUserApi();
  const input = await parseJson(req, onboardingRestaurantSchema);
  const ctx = await getStaffContext();
  if (ctx && ctx.restaurant.onboardingStep < 7 && ctx.role === "OWNER") {
    if (!(await isSlugAvailable(input.slug, ctx.restaurant.id))) throw new AppError("Энэ холбоос аль хэдийн ашиглагдаж байна. Өөр нэр сонгоно уу.", 409);
    const r = await db.restaurant.update({
      where: { id: ctx.restaurant.id },
      data: { ...input, logoText: input.name.slice(0, 2).toUpperCase(), onboardingStep: Math.max(2, ctx.restaurant.onboardingStep) },
    });
    return ok({ id: r.id, slug: r.slug });
  }
  const r = await createRestaurantForOwner(user.id, input);
  await setActiveRestaurant(r.id);
  return ok({ id: r.id, slug: r.slug }, { status: 201 });
});
