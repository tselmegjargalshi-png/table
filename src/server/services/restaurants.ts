import "server-only";
import type { z } from "zod";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { onboardingRestaurantSchema, restaurantSettingsSchema } from "@/server/validation/schemas";

export const DEFAULT_HOURS = Array.from({ length: 7 }, (_, day) => ({
  day,
  open: day === 0 ? "10:00" : "08:00",
  close: day === 5 || day === 6 ? "23:00" : "22:00",
  closed: false,
}));

export type OpeningHours = typeof DEFAULT_HOURS;

export function parseHours(value: unknown): OpeningHours {
  if (Array.isArray(value) && value.length === 7) return value as OpeningHours;
  return DEFAULT_HOURS;
}

const RESERVED_SLUGS = new Set(["app", "api", "kitchen", "login", "register", "admin", "onboarding", "demo", "r", "www", "table"]);

export async function isSlugAvailable(slug: string, exceptId?: string) {
  if (RESERVED_SLUGS.has(slug)) return false;
  const existing = await db.restaurant.findUnique({ where: { slug }, select: { id: true } });
  return !existing || existing.id === exceptId;
}

export async function createRestaurantForOwner(userId: string, input: z.infer<typeof onboardingRestaurantSchema>) {
  if (!(await isSlugAvailable(input.slug))) throw new AppError("Энэ холбоос аль хэдийн ашиглагдаж байна. Өөр нэр сонгоно уу.", 409);
  return db.$transaction(async (tx) => {
    const restaurant = await tx.restaurant.create({
      data: {
        name: input.name,
        slug: input.slug,
        address: input.address ?? null,
        phone: input.phone ?? null,
        tagline: input.tagline ?? null,
        serviceFeePercent: input.serviceFeePercent,
        openingHours: DEFAULT_HOURS,
        logoText: input.name.slice(0, 2).toUpperCase(),
        onboardingStep: 2,
        staff: { create: { userId, role: "OWNER" } },
        menus: { create: { name: "Үндсэн меню" } },
      },
    });
    await tx.user.update({ where: { id: userId }, data: { role: "OWNER" } });
    return restaurant;
  });
}

export async function updateRestaurantSettings(restaurantId: string, input: z.infer<typeof restaurantSettingsSchema>) {
  if (!input.allowDineIn && !input.allowTakeaway && !input.allowDelivery) {
    throw new AppError("Хамгийн багадаа нэг захиалгын төрөл идэвхтэй байх шаардлагатай.", 422);
  }
  return db.restaurant.update({ where: { id: restaurantId }, data: input });
}

/** Одоо нээлттэй эсэх (Улаанбаатарын цагаар) */
export function openState(hours: OpeningHours, now = new Date()) {
  const local = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ulaanbaatar" }));
  const day = local.getDay();
  const minutes = local.getHours() * 60 + local.getMinutes();
  const today = hours.find((h) => h.day === day);
  if (!today || today.closed) return { open: false, today };
  const toMin = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
  const open = minutes >= toMin(today.open) && minutes < toMin(today.close);
  return { open, today };
}
