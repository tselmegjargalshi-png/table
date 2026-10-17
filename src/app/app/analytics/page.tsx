import { PageHeader } from "@/components/ui/card";
import { AnalyticsClient } from "@/components/app/analytics-client";
import { MANAGER_ROLES, requireStaffPage } from "@/lib/auth/guard";
import { getAnalytics } from "@/server/services/analytics";
import { tickDemo } from "@/server/services/demo";

export const metadata = { title: "Тайлан" };

export default async function AnalyticsPage() {
  const { restaurant } = await requireStaffPage(MANAGER_ROLES);
  await tickDemo(restaurant);
  const data = await getAnalytics(restaurant.id, 7);
  return (
    <>
      <PageHeader title="Тайлан" description="Борлуулалт, захиалга, шилдэг бүтээгдэхүүн, оргил цагийн бодит тооцоолол." />
      <AnalyticsClient initial={data} />
    </>
  );
}
