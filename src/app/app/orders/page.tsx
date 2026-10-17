import { PageHeader } from "@/components/ui/card";
import { OrdersClient } from "@/components/app/orders-client";
import { requireStaffPage } from "@/lib/auth/guard";
import { tickDemo } from "@/server/services/demo";
import { listOrders } from "@/server/services/orders";

export const metadata = { title: "Захиалга" };

export default async function OrdersPage() {
  const { restaurant } = await requireStaffPage();
  await tickDemo(restaurant);
  const orders = await listOrders(restaurant.id, "active");
  return (
    <>
      <PageHeader title="Захиалга" description="Орж ирсэн захиалгын төлөвийг шинэчилнэ. Төлөв өөрчлөгдөхөд үйлчлүүлэгчийн дэлгэц дээр шууд харагдана." />
      <OrdersClient initial={orders} />
    </>
  );
}
