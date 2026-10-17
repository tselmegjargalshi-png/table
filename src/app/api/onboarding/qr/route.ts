import { handle, ok } from "@/lib/api";
import { requireStaffApi } from "@/lib/auth/guard";
import { menuUrl } from "@/lib/urls";
import { ensureRestaurantQr, qrSvg } from "@/server/services/qr";

/** 6-р алхам: рестораны QR кодыг харуулна */
export const GET = handle(async () => {
  const { restaurant } = await requireStaffApi(["OWNER", "MANAGER"]);
  await ensureRestaurantQr(restaurant.id);
  const url = menuUrl(restaurant.slug);
  return ok({ url, svg: await qrSvg(url) });
});
