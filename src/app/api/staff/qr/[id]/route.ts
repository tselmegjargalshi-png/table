import { fail, handle, ok } from "@/lib/api";
import { MANAGER_ROLES, requireStaffApi } from "@/lib/auth/guard";
import { regenerateQr } from "@/server/services/qr";

/** QR кодыг шинэчилнэ: хуучин хэвлэсэн код хүчингүй болно */
export const POST = handle(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { restaurant } = await requireStaffApi(MANAGER_ROLES);
  const qr = await regenerateQr(restaurant.id, id);
  if (!qr) return fail("QR код олдсонгүй.", 404);
  return ok({ id: qr.id });
});
