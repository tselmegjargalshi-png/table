import "server-only";
import sharp from "sharp";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";

const MAX_BYTES = 6 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Зургийг 1200px хүртэл багасгаж WebP хэлбэрээр хадгална.
 * Үйлдвэрлэлд S3, Vercel Blob зэрэг рүү шилжүүлэх бол зөвхөн энэ функцийг солиход хангалттай.
 */
export async function storeImage(restaurantId: string, file: File) {
  if (!ALLOWED.includes(file.type)) throw new AppError("Зөвхөн JPG, PNG, WebP зураг оруулна уу.", 415);
  if (file.size > MAX_BYTES) throw new AppError("Зургийн хэмжээ 6MB-аас ихгүй байна.", 413);
  const input = Buffer.from(await file.arrayBuffer());
  let output: Buffer;
  let meta: { width: number; height: number };
  try {
    const result = await sharp(input)
      .rotate()
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });
    output = result.data;
    meta = result.info;
  } catch {
    throw new AppError("Зургийг уншиж чадсангүй. Өөр зураг сонгоно уу.", 422);
  }
  const image = await db.image.create({
    data: { restaurantId, mime: "image/webp", width: meta.width, height: meta.height, bytes: new Uint8Array(output) },
    select: { id: true },
  });
  return { id: image.id, url: `/api/images/${image.id}` };
}
