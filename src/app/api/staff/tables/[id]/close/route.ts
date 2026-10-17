import { z } from "zod";
import { handle, ok, parseJson } from "@/lib/api";
import { requireStaffApi } from "@/lib/auth/guard";
import { closeTable } from "@/server/services/tables";

const schema = z.object({ method: z.enum(["CASH", "CARD", "QPAY"]) });

export const POST = handle(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { restaurant } = await requireStaffApi(["OWNER", "MANAGER", "WAITER", "CASHIER"]);
  const { method } = await parseJson(req, schema);
  return ok(await closeTable(restaurant.id, id, method));
});
