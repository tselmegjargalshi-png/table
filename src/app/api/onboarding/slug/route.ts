import { handle, ok } from "@/lib/api";
import { requireUserApi } from "@/lib/auth/guard";
import { isSlugAvailable } from "@/server/services/restaurants";
import { slugSchema } from "@/server/validation/schemas";

export const GET = handle(async (req) => {
  await requireUserApi();
  const parsed = slugSchema.safeParse(new URL(req.url).searchParams.get("slug") ?? "");
  if (!parsed.success) return ok({ available: false, message: parsed.error.issues[0].message });
  const available = await isSlugAvailable(parsed.data);
  return ok({ available, message: available ? "Боломжтой" : "Энэ холбоос аль хэдийн ашиглагдаж байна." });
});
