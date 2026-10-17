import { MenuManager } from "@/components/app/menu-manager";
import { PageHeader } from "@/components/ui/card";
import { MANAGER_ROLES, requireStaffPage } from "@/lib/auth/guard";
import { toStaffCategories } from "@/lib/staff-menu-types";
import { getStaffMenu } from "@/server/services/menu";

export const metadata = { title: "Меню" };

export default async function MenuPage() {
  const { restaurant, role } = await requireStaffPage();
  const cats = toStaffCategories(await getStaffMenu(restaurant.id));
  return (
    <>
      <PageHeader title="Меню" description="Ангилал, бүтээгдэхүүн, үнэ, сонголт, нэмэлтээ удирдана. Өөрчлөлт үйлчлүүлэгчийн меню дээр шууд харагдана." />
      <MenuManager initial={cats} canEdit={MANAGER_ROLES.includes(role)} slug={restaurant.slug} />
    </>
  );
}
