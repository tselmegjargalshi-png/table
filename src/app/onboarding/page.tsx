import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/app/onboarding-wizard";
import { getStaffContext } from "@/lib/auth/guard";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Ресторан бүртгэх", robots: { index: false, follow: false } };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/onboarding");
  const ctx = await getStaffContext();
  if (!ctx && user.role === "CUSTOMER") redirect("/account");
  if (ctx && (ctx.restaurant.onboardingStep >= 7 || ctx.role !== "OWNER")) redirect(ctx.role === "KITCHEN" ? "/kitchen" : "/app");

  const r = ctx?.restaurant ?? null;
  const [categories, itemCount, tableCount] = r
    ? await Promise.all([
        db.menuCategory.findMany({ where: { restaurantId: r.id }, orderBy: { position: "asc" }, select: { id: true, name: true } }),
        db.menuItem.count({ where: { restaurantId: r.id } }),
        db.table.count({ where: { restaurantId: r.id } }),
      ])
    : [[], 0, 0];

  return (
    <OnboardingWizard
      userName={user.name}
      startStep={r ? Math.min(6, Math.max(3, r.onboardingStep + 1)) : 2}
      restaurant={r ? { name: r.name, slug: r.slug, address: r.address ?? "", phone: r.phone ?? "", tagline: r.tagline ?? "", serviceFeePercent: r.serviceFeePercent } : null}
      categories={categories}
      itemCount={itemCount}
      tableCount={tableCount}
    />
  );
}
