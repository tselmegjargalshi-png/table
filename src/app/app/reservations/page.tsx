import { PageHeader } from "@/components/ui/card";
import { ReservationsClient } from "@/components/app/reservations-client";
import { requireStaffPage } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { listReservations, reservationCounts } from "@/server/services/reservations";

export const metadata = { title: "Урьдчилсан захиалга" };

export default async function ReservationsPage() {
  const { restaurant } = await requireStaffPage();
  const [items, counts, tables] = await Promise.all([
    listReservations(restaurant.id, "today"),
    reservationCounts(restaurant.id),
    db.table.findMany({ where: { restaurantId: restaurant.id }, orderBy: { number: "asc" }, select: { id: true, number: true, seats: true } }),
  ]);
  return (
    <>
      <PageHeader title="Урьдчилсан захиалга" description="Ширээний захиалгыг баталгаажуулж, ширээ оноож, ирсэн үйлчлүүлэгчийг бүртгэнэ." />
      <ReservationsClient initial={items} counts={counts} tables={tables} />
    </>
  );
}
