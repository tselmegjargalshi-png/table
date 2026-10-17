import { PageHeader } from "@/components/ui/card";
import { SettingsClient } from "@/components/app/settings-client";
import { MANAGER_ROLES, requireStaffPage } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { parseHours } from "@/server/services/restaurants";

export const metadata = { title: "Тохиргоо" };

export default async function SettingsPage() {
  const { restaurant: r, role } = await requireStaffPage();
  const staff = await db.restaurantStaff.findMany({
    where: { restaurantId: r.id },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
  return (
    <>
      <PageHeader title="Тохиргоо" description="Рестораны мэдээлэл, захиалгын төрөл, ажлын цаг, брэндийн өнгө." />
      <SettingsClient
        canEdit={MANAGER_ROLES.includes(role)}
        initial={{
          slug: r.slug,
          name: r.name,
          tagline: r.tagline ?? "",
          description: r.description ?? "",
          address: r.address ?? "",
          district: r.district ?? "",
          phone: r.phone ?? "",
          email: r.email ?? "",
          brandColor: r.brandColor,
          serviceFeePercent: r.serviceFeePercent,
          deliveryFee: r.deliveryFee,
          allowDineIn: r.allowDineIn,
          allowTakeaway: r.allowTakeaway,
          allowDelivery: r.allowDelivery,
          acceptingOrders: r.acceptingOrders,
          openingHours: parseHours(r.openingHours),
          logoText: r.logoText,
        }}
        staff={staff.map((m) => ({ id: m.id, name: m.user.name, email: m.user.email, role: m.role }))}
      />
    </>
  );
}
