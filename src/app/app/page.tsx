import { PageHeader } from "@/components/ui/card";
import { DashboardClient } from "@/components/app/dashboard-client";
import { requireStaffPage } from "@/lib/auth/guard";
import { formatDate, ubParts, WEEKDAYS } from "@/lib/format";
import { getDashboardData } from "@/server/services/analytics";
import { tickDemo } from "@/server/services/demo";

export const metadata = { title: "Хянах самбар" };

export default async function DashboardPage() {
  const { restaurant, user } = await requireStaffPage();
  await tickDemo(restaurant);
  const data = await getDashboardData(restaurant.id);
  const now = new Date();
  return (
    <>
      <PageHeader eyebrow={`${WEEKDAYS[ubParts(now).weekday]}, ${formatDate(now)}`} title={`Сайн байна уу, ${user.name}`} description={`${restaurant.name}: өнөөдрийн үйл ажиллагааны тойм`} />
      <DashboardClient initial={data} />
    </>
  );
}
