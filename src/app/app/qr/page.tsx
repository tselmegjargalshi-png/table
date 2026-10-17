import { PageHeader } from "@/components/ui/card";
import { QrClient } from "@/components/app/qr-client";
import { MANAGER_ROLES, requireStaffPage } from "@/lib/auth/guard";
import { listQrCodes } from "@/server/services/qr";

export const metadata = { title: "QR код" };

export default async function QrPage() {
  const { restaurant, role } = await requireStaffPage();
  const codes = await listQrCodes(restaurant.id);
  return (
    <>
      <PageHeader title="QR код" description="Рестораны болон ширээ тус бүрийн QR кодыг татах, хэвлэх." />
      <QrClient codes={codes} canManage={MANAGER_ROLES.includes(role)} restaurantName={restaurant.name} />
    </>
  );
}
