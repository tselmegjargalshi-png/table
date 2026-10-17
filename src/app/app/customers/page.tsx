import { PageHeader } from "@/components/ui/card";
import { CustomersClient } from "@/components/app/customers-client";
import { requireStaffPage } from "@/lib/auth/guard";
import { customerStats, listCustomers } from "@/server/services/customers";

export const metadata = { title: "Үйлчлүүлэгч" };

export default async function CustomersPage() {
  const { restaurant } = await requireStaffPage();
  const [rows, stats] = await Promise.all([listCustomers(restaurant.id), customerStats(restaurant.id)]);
  return (
    <>
      <PageHeader title="Үйлчлүүлэгч" description="Үйлчлүүлэгчдийн зочилсон түүх, зарцуулалт, дуртай хоолыг нэг дороос харна." />
      <CustomersClient initial={rows} stats={stats} />
    </>
  );
}
