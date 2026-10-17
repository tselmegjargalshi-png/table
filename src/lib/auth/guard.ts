import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Restaurant, StaffRole } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError, MESSAGES } from "@/lib/errors";
import { ACTIVE_RESTAURANT_COOKIE, getCurrentUser, type SessionUser } from "./session";

export type StaffContext = {
  user: SessionUser;
  restaurant: Restaurant;
  role: StaffRole;
};

export const MANAGER_ROLES: StaffRole[] = ["OWNER", "MANAGER"];

/** Нэвтэрсэн хэрэглэгчийн идэвхтэй ресторан. Зөвхөн өөрийн гишүүнчлэлтэй ресторанд хандана. */
export const getStaffContext = cache(async (): Promise<StaffContext | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const jar = await cookies();
  const preferred = jar.get(ACTIVE_RESTAURANT_COOKIE)?.value;

  const memberships = await db.restaurantStaff.findMany({
    where: { userId: user.id },
    include: { restaurant: true },
    orderBy: { createdAt: "asc" },
  });
  if (memberships.length === 0) return null;
  const active = memberships.find((m) => m.restaurantId === preferred) ?? memberships[0];
  return { user, restaurant: active.restaurant, role: active.role };
});

/** Хуудсанд: нэвтрээгүй бол нэвтрэх хуудас руу, ресторангүй бол онбординг руу шилжүүлнэ. */
export async function requireStaffPage(roles?: StaffRole[]): Promise<StaffContext> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const ctx = await getStaffContext();
  if (!ctx) redirect("/onboarding");
  if (roles && !roles.includes(ctx.role)) redirect(ctx.role === "KITCHEN" ? "/kitchen" : "/app");
  return ctx;
}

/** API-д: эрхгүй бол AppError шиднэ. */
export async function requireStaffApi(roles?: StaffRole[]): Promise<StaffContext> {
  const user = await getCurrentUser();
  if (!user) throw new AppError(MESSAGES.unauthorized, 401, "unauthorized");
  const ctx = await getStaffContext();
  if (!ctx) throw new AppError(MESSAGES.forbidden, 403, "forbidden");
  if (roles && !roles.includes(ctx.role)) throw new AppError(MESSAGES.forbidden, 403, "forbidden");
  return ctx;
}

export async function requireUserApi(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AppError(MESSAGES.unauthorized, 401, "unauthorized");
  return user;
}
