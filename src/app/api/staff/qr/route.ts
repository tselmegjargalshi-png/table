import { handle, ok } from "@/lib/api";
import { requireStaffApi } from "@/lib/auth/guard";
import { listQrCodes } from "@/server/services/qr";

export const GET = handle(async () => {
  const { restaurant } = await requireStaffApi();
  return ok(await listQrCodes(restaurant.id));
});
