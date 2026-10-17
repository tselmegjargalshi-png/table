import { clientIp, handle, ok, rateLimit } from "@/lib/api";
import { MANAGER_ROLES, requireStaffApi } from "@/lib/auth/guard";
import { AppError } from "@/lib/errors";
import { storeImage } from "@/server/services/images";

export const POST = handle(async (req) => {
  const { restaurant } = await requireStaffApi(MANAGER_ROLES);
  rateLimit(`upload:${clientIp(req)}`, 30, 60_000);
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new AppError("Зураг сонгоно уу.", 422);
  return ok(await storeImage(restaurant.id, file), { status: 201 });
});
