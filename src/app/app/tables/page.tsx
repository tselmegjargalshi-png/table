import { PageHeader } from "@/components/ui/card";
import { TablesClient } from "@/components/app/tables-client";
import { MANAGER_ROLES, requireStaffPage } from "@/lib/auth/guard";
import { tickDemo } from "@/server/services/demo";
import { listTables } from "@/server/services/tables";

export const metadata = { title: "Ширээ" };

export default async function TablesPage() {
  const { restaurant, role } = await requireStaffPage();
  await tickDemo(restaurant);
  const tables = await listTables(restaurant.id);
  return (
    <>
      <PageHeader title="Ширээ" description="Танхимын байдлыг бодит цагаар харна. Ширээг сонгож захиалга, төлбөр, төлөвийг удирдана." />
      <TablesClient initial={tables} canManage={MANAGER_ROLES.includes(role)} />
    </>
  );
}
