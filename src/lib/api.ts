import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { AppError, MESSAGES } from "@/lib/errors";

export type ApiOk<T> = { ok: true; data: T };
export type ApiFail = { ok: false; error: string; fields?: Record<string, string> };

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiOk<T>>({ ok: true, data }, init);
}

export function fail(error: string, status = 400, fields?: Record<string, string>) {
  return NextResponse.json<ApiFail>({ ok: false, error, fields }, { status });
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/** Route handler-ийн алдааг нэг загвараар монгол мессежтэй буцаана. */
export function handle<C>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof AppError) return fail(err.message, err.status);
      if (err instanceof ZodError) {
        const fields: Record<string, string> = {};
        for (const issue of err.issues) {
          const key = issue.path.join(".");
          if (!fields[key]) fields[key] = issue.message;
        }
        return fail(MESSAGES.invalid, 422, fields);
      }
      console.error("[api]", err);
      return fail(`${MESSAGES.generic} ${MESSAGES.retry}`, 500);
    }
  };
}

export async function parseJson<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new AppError(MESSAGES.invalid, 400);
  }
  return schema.parse(body);
}

/** Энгийн санах ойн хурд хязгаарлагч (serverless орчинд нэг instance-ийн хүрээнд ажиллана). */
const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) throw new AppError(MESSAGES.rateLimited, 429, "rate_limited");
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}
