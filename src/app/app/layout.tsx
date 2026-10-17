import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { requireStaffPage } from "@/lib/auth/guard";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: { default: "Хянах самбар", template: "%s | TABLE.MN" }, robots: { index: false, follow: false } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireStaffPage();
  if (ctx.role === "KITCHEN") redirect("/kitchen");
  if (ctx.restaurant.onboardingStep < 7 && ctx.role === "OWNER") redirect("/onboarding");
  const memberships = await db.restaurantStaff.findMany({
    where: { userId: ctx.user.id },
    select: { restaurant: { select: { id: true, name: true } } },
  });
  const r = ctx.restaurant;
  return (
    <AppShell
      user={{ name: ctx.user.name, email: ctx.user.email }}
      restaurant={{ slug: r.slug, name: r.name, brandColor: r.brandColor, logoText: r.logoText, isDemo: r.isDemo }}
      role={ctx.role}
      restaurants={memberships.map((m) => ({ id: m.restaurant.id, name: m.restaurant.name, active: m.restaurant.id === r.id }))}
    >
      {children}
    </AppShell>
  );
}
