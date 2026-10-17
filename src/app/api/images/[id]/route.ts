import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const image = await db.image.findUnique({ where: { id }, select: { bytes: true, mime: true } });
  if (!image) return new Response("Зураг олдсонгүй.", { status: 404 });
  return new Response(new Uint8Array(image.bytes), {
    headers: {
      "Content-Type": image.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
