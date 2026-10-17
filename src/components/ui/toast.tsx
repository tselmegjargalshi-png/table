"use client";

import { AnimatePresence, motion } from "motion/react";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; kind: ToastKind; title: string; description?: string };

type ToastApi = {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
};

const Ctx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const push = useCallback((kind: ToastKind, title: string, description?: string) => {
    const id = ++seq.current;
    setItems((list) => [...list.slice(-3), { id, kind, title, description }]);
    window.setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), kind === "error" ? 6000 : 3500);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (t, d) => push("success", t, d),
      error: (t, d) => push("error", t, d),
      info: (t, d) => push("info", t, d),
    }),
    [push],
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end">
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              role={t.kind === "error" ? "alert" : "status"}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-white/10 bg-ink px-4 py-3 text-paper shadow-float"
            >
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                  t.kind === "success" && "bg-success text-white",
                  t.kind === "error" && "bg-danger text-white",
                  t.kind === "info" && "bg-white/15 text-white",
                )}
              >
                <Icon name={t.kind === "success" ? "check" : t.kind === "error" ? "alert" : "info"} size={12} strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{t.title}</p>
                {t.description ? <p className="mt-0.5 text-[13px] text-paper/65">{t.description}</p> : null}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast нь ToastProvider дотор ашиглагдах ёстой.");
  return ctx;
}
