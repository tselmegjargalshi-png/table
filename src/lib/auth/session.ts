import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "tm_session";
const SESSION_DAYS = 30;

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET тохируулаагүй эсвэл 32 тэмдэгтээс богино байна.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const h = await headers();
  const session = await db.session.create({
    data: { userId, expiresAt, userAgent: h.get("user-agent")?.slice(0, 250) ?? null },
  });
  const token = await new SignJWT({ sid: session.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secretKey());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const sid = await readSessionId(token);
    if (sid) await db.session.deleteMany({ where: { id: sid } });
  }
  jar.delete(SESSION_COOKIE);
  jar.delete(ACTIVE_RESTAURANT_COOKIE);
}

async function readSessionId(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    return typeof payload.sid === "string" ? payload.sid : null;
  } catch {
    return null;
  }
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: "CUSTOMER" | "OWNER" | "ADMIN";
};

/** Нэг хүсэлтийн хүрээнд зөвхөн нэг удаа өгөгдлийн сангаас уншина. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const sid = await readSessionId(token);
  if (!sid) return null;
  const session = await db.session.findUnique({
    where: { id: sid },
    select: {
      expiresAt: true,
      user: { select: { id: true, email: true, name: true, phone: true, role: true } },
    },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
});

export const ACTIVE_RESTAURANT_COOKIE = "tm_rid";

export async function setActiveRestaurant(restaurantId: string): Promise<void> {
  const jar = await cookies();
  jar.set(ACTIVE_RESTAURANT_COOKIE, restaurantId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
