import "server-only";
import type { Restaurant } from "@prisma/client";
import { db } from "@/lib/db";
import { simulateDemoActivity } from "@/server/demo/simulate";
import { refreshAnalyticsDay } from "./analytics";

/** Демо ресторан бол бодит цагийн идэвхийг шинэчилнэ. Бусад ресторанд юу ч хийхгүй. */
export async function tickDemo(restaurant: Pick<Restaurant, "id" | "isDemo">): Promise<void> {
  if (!restaurant.isDemo) return;
  try {
    const changed = await simulateDemoActivity(db, restaurant.id);
    if (changed) {
      await refreshAnalyticsDay(restaurant.id);
      await refreshAnalyticsDay(restaurant.id, new Date(Date.now() - 24 * 3600000));
    }
  } catch (err) {
    console.error("[demo] simulate failed", err);
  }
}
