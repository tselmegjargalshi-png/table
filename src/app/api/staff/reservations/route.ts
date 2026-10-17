import { handle, ok, parseJson } from "@/lib/api";
import { requireStaffApi } from "@/lib/auth/guard";
import { createReservation, listReservations, reservationCounts, type ReservationRange } from "@/server/services/reservations";
import { reservationSchema } from "@/server/validation/schemas";

export const GET = handle(async (req) => {
  const { restaurant } = await requireStaffApi();
  const r = new URL(req.url).searchParams.get("range");
  const range: ReservationRange = r === "tomorrow" || r === "week" ? r : "today";
  const [items, counts] = await Promise.all([listReservations(restaurant.id, range), reservationCounts(restaurant.id)]);
  return ok({ items, counts });
});

export const POST = handle(async (req) => {
  const { restaurant } = await requireStaffApi();
  const r = await createReservation(restaurant.id, await parseJson(req, reservationSchema));
  return ok({ id: r.id }, { status: 201 });
});
