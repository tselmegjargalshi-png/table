"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./fetcher";

/** Тогтмол хугацаанд өгөгдөл шинэчлэх. Таб нуугдсан үед түр зогсоно. */
export function usePoll<T>(url: string | null, initial: T, intervalMs = 5000) {
  const [data, setData] = useState<T>(initial);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number>(() => Date.now());
  const inFlight = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!url) return;
    inFlight.current?.abort();
    const ctrl = new AbortController();
    inFlight.current = ctrl;
    try {
      const next = await api<T>(url, { signal: ctrl.signal });
      setData(next);
      setError(null);
      setUpdatedAt(Date.now());
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError((err as Error).message);
    }
  }, [url]);

  useEffect(() => {
    if (!url) return;
    let timer: number | undefined;
    const tick = () => {
      if (document.visibilityState === "visible") void refresh();
      timer = window.setTimeout(tick, intervalMs);
    };
    timer = window.setTimeout(tick, intervalMs);
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
      inFlight.current?.abort();
    };
  }, [url, intervalMs, refresh]);

  return { data, setData, error, refresh, updatedAt };
}

/** Секунд тутам шинэчлэгдэх одоогийн цаг (таймерт) */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}
