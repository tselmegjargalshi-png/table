"use client";

export class ClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

/** API дуудлага: амжилтгүй бол монгол мессежтэй ClientError шиднэ */
export async function api<T>(url: string, init?: { method?: string; body?: unknown; signal?: AbortSignal }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: init?.method ?? (init?.body !== undefined ? "POST" : "GET"),
      headers: init?.body !== undefined && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : undefined,
      body: init?.body instanceof FormData ? init.body : init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: init?.signal,
      cache: "no-store",
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ClientError("Сүлжээний холболтоо шалгаад дахин оролдоно уу.", 0);
  }
  let json: { ok: boolean; data?: T; error?: string; fields?: Record<string, string> } | null = null;
  try {
    json = await res.json();
  } catch {
    /* хоосон хариу */
  }
  if (!res.ok || !json?.ok) {
    throw new ClientError(json?.error ?? "Мэдээлэл ачааллахад алдаа гарлаа. Дахин оролдоно уу.", res.status, json?.fields);
  }
  return json.data as T;
}
