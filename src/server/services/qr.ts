import "server-only";
import crypto from "node:crypto";
import QRCodeLib from "qrcode";
import { db } from "@/lib/db";
import { menuUrl } from "@/lib/urls";

function newCode() {
  return crypto.randomBytes(5).toString("base64url").replace(/[-_]/g, "x").toLowerCase();
}

export async function ensureRestaurantQr(restaurantId: string) {
  const existing = await db.qRCode.findFirst({ where: { restaurantId, type: "RESTAURANT" } });
  return existing ?? db.qRCode.create({ data: { restaurantId, type: "RESTAURANT", code: newCode() } });
}

export async function ensureTableQr(restaurantId: string, tableId: string) {
  const existing = await db.qRCode.findFirst({ where: { restaurantId, tableId, type: "TABLE" } });
  return existing ?? db.qRCode.create({ data: { restaurantId, tableId, type: "TABLE", code: newCode() } });
}

export async function regenerateQr(restaurantId: string, qrId: string) {
  const qr = await db.qRCode.findFirst({ where: { id: qrId, restaurantId } });
  if (!qr) return null;
  return db.qRCode.update({ where: { id: qr.id }, data: { code: newCode(), scans: 0, lastScanAt: null } });
}

export async function listQrCodes(restaurantId: string) {
  const restaurant = await db.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, select: { slug: true } });
  await ensureRestaurantQr(restaurantId);
  const tables = await db.table.findMany({ where: { restaurantId }, select: { id: true } });
  for (const t of tables) await ensureTableQr(restaurantId, t.id);

  const codes = await db.qRCode.findMany({
    where: { restaurantId },
    include: { table: { select: { number: true, seats: true, zone: true } } },
  });
  codes.sort((a, b) => (a.type === "RESTAURANT" ? -1 : b.type === "RESTAURANT" ? 1 : (a.table?.number ?? 0) - (b.table?.number ?? 0)));
  return Promise.all(
    codes.map(async (c) => {
      const url = menuUrl(restaurant.slug, c.type === "TABLE" ? c.code : undefined);
      return {
        id: c.id,
        type: c.type,
        code: c.code,
        url,
        scans: c.scans,
        table: c.table,
        svg: await qrSvg(url),
      };
    }),
  );
}

export type QrDTO = Awaited<ReturnType<typeof listQrCodes>>[number];

export async function qrSvg(text: string): Promise<string> {
  return QRCodeLib.toString(text, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#141312", light: "#00000000" } });
}

/** QR уншуулсан тоог бүртгэнэ */
export async function trackScan(restaurantId: string, code: string) {
  const qr = await db.qRCode.findFirst({ where: { restaurantId, code }, include: { table: true } });
  if (!qr) return null;
  await db.qRCode.update({ where: { id: qr.id }, data: { scans: { increment: 1 }, lastScanAt: new Date() } });
  return qr;
}
