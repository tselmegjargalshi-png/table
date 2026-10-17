import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicOrder } from "@/server/services/orders";
import { OrderTracker } from "@/components/menu/order-tracker";

export const metadata: Metadata = { title: "Захиалгын төлөв", robots: { index: false, follow: false } };

export default async function OrderPage({ params }: { params: Promise<{ slug: string; token: string }> }) {
  const { slug, token } = await params;
  const order = await getPublicOrder(token);
  if (!order || order.restaurant.slug !== slug) notFound();
  return <OrderTracker initial={order} token={token} />;
}
