import "server-only";
import type { z } from "zod";
import { db } from "@/lib/db";
import { AppError, MESSAGES } from "@/lib/errors";
import type { categorySchema, menuItemPatchSchema, menuItemSchema } from "@/server/validation/schemas";

export async function getActiveMenu(restaurantId: string) {
  const existing = await db.menu.findFirst({ where: { restaurantId, isActive: true }, orderBy: { createdAt: "asc" } });
  return existing ?? db.menu.create({ data: { restaurantId, name: "Үндсэн меню" } });
}

/** Үйлчлүүлэгчид харагдах меню */
export async function getPublicMenu(slug: string) {
  const restaurant = await db.restaurant.findUnique({
    where: { slug },
    include: {
      categories: {
        where: { isVisible: true },
        orderBy: { position: "asc" },
        include: {
          items: {
            orderBy: { position: "asc" },
            include: { options: { orderBy: { position: "asc" } } },
          },
        },
      },
    },
  });
  if (!restaurant) return null;
  return restaurant;
}

export type PublicMenu = NonNullable<Awaited<ReturnType<typeof getPublicMenu>>>;

export async function getStaffMenu(restaurantId: string) {
  return db.menuCategory.findMany({
    where: { restaurantId },
    orderBy: { position: "asc" },
    include: {
      items: { orderBy: { position: "asc" }, include: { options: { orderBy: { position: "asc" } } } },
      _count: { select: { items: true } },
    },
  });
}

export type StaffMenu = Awaited<ReturnType<typeof getStaffMenu>>;

export async function createCategory(restaurantId: string, input: z.infer<typeof categorySchema>) {
  const menu = await getActiveMenu(restaurantId);
  const last = await db.menuCategory.aggregate({ where: { restaurantId }, _max: { position: true } });
  return db.menuCategory.create({
    data: { ...input, restaurantId, menuId: menu.id, position: (last._max.position ?? -1) + 1 },
  });
}

export async function updateCategory(restaurantId: string, id: string, input: z.infer<typeof categorySchema>) {
  const cat = await db.menuCategory.findFirst({ where: { id, restaurantId } });
  if (!cat) throw new AppError(MESSAGES.notFound, 404);
  return db.menuCategory.update({ where: { id }, data: input });
}

export async function deleteCategory(restaurantId: string, id: string) {
  const cat = await db.menuCategory.findFirst({ where: { id, restaurantId }, include: { _count: { select: { items: true } } } });
  if (!cat) throw new AppError(MESSAGES.notFound, 404);
  if (cat._count.items > 0) {
    throw new AppError("Ангилалд бүтээгдэхүүн байгаа тул устгах боломжгүй. Эхлээд бүтээгдэхүүнүүдийг шилжүүлэх эсвэл устгана уу.", 409);
  }
  await db.menuCategory.delete({ where: { id } });
}

export async function reorderCategories(restaurantId: string, ids: string[]) {
  const owned = await db.menuCategory.count({ where: { restaurantId, id: { in: ids } } });
  if (owned !== ids.length) throw new AppError(MESSAGES.forbidden, 403);
  await db.$transaction(ids.map((id, position) => db.menuCategory.update({ where: { id }, data: { position } })));
}

export async function reorderItems(restaurantId: string, ids: string[]) {
  const owned = await db.menuItem.count({ where: { restaurantId, id: { in: ids } } });
  if (owned !== ids.length) throw new AppError(MESSAGES.forbidden, 403);
  await db.$transaction(ids.map((id, position) => db.menuItem.update({ where: { id }, data: { position } })));
}

async function assertCategory(restaurantId: string, categoryId: string) {
  const cat = await db.menuCategory.findFirst({ where: { id: categoryId, restaurantId } });
  if (!cat) throw new AppError("Ангилал олдсонгүй.", 422);
}

async function assertImage(restaurantId: string, imageUrl?: string | null) {
  if (!imageUrl) return;
  const m = imageUrl.match(/^\/api\/images\/([a-z0-9]+)$/);
  if (!m) throw new AppError("Зургийн холбоос буруу байна.", 422);
  const img = await db.image.findFirst({ where: { id: m[1], restaurantId }, select: { id: true } });
  if (!img) throw new AppError("Зураг олдсонгүй.", 422);
}

export async function createMenuItem(restaurantId: string, input: z.infer<typeof menuItemSchema>) {
  await assertCategory(restaurantId, input.categoryId);
  await assertImage(restaurantId, input.imageUrl);
  const last = await db.menuItem.aggregate({ where: { categoryId: input.categoryId }, _max: { position: true } });
  const { options, ...rest } = input;
  return db.menuItem.create({
    data: {
      ...rest,
      restaurantId,
      position: (last._max.position ?? -1) + 1,
      options: { create: options.map(({ id: _id, ...o }, position) => ({ ...o, position })) },
    },
    include: { options: true },
  });
}

export async function updateMenuItem(restaurantId: string, id: string, input: z.infer<typeof menuItemSchema>) {
  const item = await db.menuItem.findFirst({ where: { id, restaurantId } });
  if (!item) throw new AppError(MESSAGES.notFound, 404);
  await assertCategory(restaurantId, input.categoryId);
  await assertImage(restaurantId, input.imageUrl);
  const { options, ...rest } = input;
  return db.$transaction(async (tx) => {
    await tx.menuItemOption.deleteMany({ where: { itemId: id } });
    return tx.menuItem.update({
      where: { id },
      data: {
        ...rest,
        options: { create: options.map(({ id: _id, ...o }, position) => ({ ...o, position })) },
      },
      include: { options: true },
    });
  });
}

export async function patchMenuItem(restaurantId: string, id: string, input: z.infer<typeof menuItemPatchSchema>) {
  const item = await db.menuItem.findFirst({ where: { id, restaurantId } });
  if (!item) throw new AppError(MESSAGES.notFound, 404);
  return db.menuItem.update({ where: { id }, data: input });
}

export async function deleteMenuItem(restaurantId: string, id: string) {
  const item = await db.menuItem.findFirst({ where: { id, restaurantId } });
  if (!item) throw new AppError(MESSAGES.notFound, 404);
  await db.menuItem.delete({ where: { id } });
}
