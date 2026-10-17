"use client";

import { motion } from "motion/react";
import { useId, useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

export type SegmentOption<T extends string> = { value: T; label: string; count?: number };

/** Табын бүлэг: сум товчоор шилжинэ */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
  className,
  tone = "light",
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  size?: "sm" | "md";
  className?: string;
  tone?: "light" | "dark";
}) {
  const id = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (i + (e.key === "ArrowRight" ? 1 : -1) + options.length) % options.length;
    refs.current[next]?.focus();
    onChange(options[next].value);
  };
  const dark = tone === "dark";
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-md border p-0.5 scrollbar-none",
        dark ? "border-kds-line bg-kds-panel" : "border-line bg-sand/70",
        className,
      )}
    >
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onKeyDown={(e) => onKey(e, i)}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative shrink-0 rounded-[5px] font-medium transition-colors",
              size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-[13px]",
              active ? (dark ? "text-kds-text" : "text-ink") : dark ? "text-kds-muted hover:text-kds-text" : "text-stone hover:text-ink",
            )}
          >
            {active ? (
              <motion.span
                layoutId={`seg-${id}`}
                className={cn("absolute inset-0 rounded-[5px]", dark ? "bg-kds-card" : "bg-surface shadow-soft")}
                transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
              />
            ) : null}
            <span className="relative flex items-center gap-1.5">
              {o.label}
              {o.count !== undefined ? (
                <span className={cn("tabular rounded px-1 text-[11px]", active ? (dark ? "bg-kds-line" : "bg-sand") : "")}>{o.count}</span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
