import { handle, ok } from "@/lib/api";
import { requireStaffApi } from "@/lib/auth/guard";
import { tickDemo } from "@/server/services/demo";
import { listOrders, type OrderFilter } from "@/server/services/orders";

const FILTERS = new Set(["active", "today", "all", "NEW", "CONFIRMED", "PREPARING", "READY", "DELIVERED", "CANCELLED"]);

export const GET = handle(async (req) => {
  const { restaurant } = await requireStaffApi();
  await tickDemo(restaurant);
  const f = new URL(req.url).searchParams.get("filter") ?? "active";
  return ok(await listOrders(restaurant.id, (FILTERS.has(f) ? f : "active") as OrderFilter));
});
