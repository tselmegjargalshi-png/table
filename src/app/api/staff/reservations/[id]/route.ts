import { handle, ok, parseJson } from "@/lib/api";
import { requireStaffApi } from "@/lib/auth/guard";
import { deleteReservation, setReservationStatus, updateReservation } from "@/server/services/reservations";
import { reservationSchema, reservationStatusSchema } from "@/server/validation/schemas";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handle(async (req, { params }: Ctx) => {
  const { id } = await params;
  const { restaurant } = await requireStaffApi();
  const { status, tableId } = await parseJson(req, reservationStatusSchema);
  const r = await setReservationStatus(restaurant.id, id, status, tableId);
  return ok({ id: r.id, status: r.status });
});

export const PUT = handle(async (req, { params }: Ctx) => {
  const { id } = await params;
  const { restaurant } = await requireStaffApi();
  const r = await updateReservation(restaurant.id, id, await parseJson(req, reservationSchema));
  return ok({ id: r.id });
});

export const DELETE = handle(async (_req, { params }: Ctx) => {
  const { id } = await params;
  const { restaurant } = await requireStaffApi(["OWNER", "MANAGER"]);
  await deleteReservation(restaurant.id, id);
  return ok({ id });
});
