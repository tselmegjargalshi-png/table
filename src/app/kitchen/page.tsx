import type { Metadata } from "next";
import { KitchenClient } from "@/components/app/kitchen-client";
import { requireStaffPage } from "@/lib/auth/guard";
import { tickDemo } from "@/server/services/demo";
import { listKitchenOrders } from "@/server/services/orders";

export const metadata: Metadata = { title: "Гал тогооны дэлгэц", robots: { index: false, follow: false } };

export default async function KitchenPage() {
  const { restaurant, role } = await requireStaffPage();
  await tickDemo(restaurant);
  const orders = await listKitchenOrders(restaurant.id);
  return <KitchenClient initial={orders} restaurantName={restaurant.name} canGoBack={role !== "KITCHEN"} />;
}
