"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { IconButton } from "./button";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  /** "sheet": жижиг дэлгэцэнд доороос, том дэлгэцэнд баруун талаас гарна */
  variant?: "dialog" | "sheet";
  tone?: "light" | "dark";
};

const widths = { sm: "sm:max-w-sm", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" };

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, description, children, footer, size = "md", variant = "dialog", tone = "light" }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>("[data-autofocus]") ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
    }, 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
      }
      if (e.key === "Tab" && panelRef.current) {
        const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  const isSheet = variant === "sheet";
  const dark = tone === "dark";

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" data-sheet={isSheet || undefined}>
          <motion.div
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={reduce ? { opacity: 0 } : isSheet ? { y: 40, opacity: 0 } : { y: 12, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : isSheet ? { y: 40, opacity: 0 } : { y: 8, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
            className={cn(
              "relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-xl border shadow-float sm:rounded-xl",
              dark ? "border-kds-line bg-kds-panel text-kds-text" : "border-line bg-surface",
              isSheet ? "sm:fixed sm:inset-y-3 sm:right-3 sm:max-h-none sm:max-w-md" : widths[size],
            )}
          >
            <div className={cn("flex items-start justify-between gap-4 border-b px-5 py-4", dark ? "border-kds-line" : "border-line")}>
              <div className="min-w-0">
                <h2 id={titleId} className="text-base font-semibold tracking-[-0.01em]">
                  {title}
                </h2>
                {description ? <div className={cn("mt-0.5 text-[13px]", dark ? "text-kds-muted" : "text-stone")}>{description}</div> : null}
              </div>
              <IconButton icon="x" label="Хаах" size="sm" onClick={onClose} className={dark ? "text-kds-muted hover:bg-kds-card" : ""} />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
            {footer ? (
              <div className={cn("flex flex-wrap items-center justify-end gap-2 border-t px-5 py-3.5", dark ? "border-kds-line" : "border-line bg-paper/60")}>{footer}</div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Тийм",
  danger,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button className="h-9 rounded-md px-3 text-sm font-medium text-charcoal hover:bg-sand" onClick={onClose}>
            Болих
          </button>
          <button
            data-autofocus
            disabled={loading}
            onClick={onConfirm}
            className={cn(
              "h-9 rounded-md px-4 text-sm font-medium text-white disabled:opacity-60",
              danger ? "bg-danger hover:bg-danger/90" : "bg-ink hover:bg-charcoal",
            )}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-sm text-stone">{description}</div>
    </Modal>
  );
}
