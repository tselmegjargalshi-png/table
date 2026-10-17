"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./icon";

export type DropdownItem = { label: string; icon?: IconName; onSelect: () => void; danger?: boolean; disabled?: boolean };

export function Dropdown({ trigger, items, align = "end", label }: { trigger: (props: { open: boolean }) => ReactNode; items: DropdownItem[]; align?: "start" | "end"; label: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.setTimeout(() => itemRefs.current.find(Boolean)?.focus(), 10);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const move = (dir: 1 | -1) => {
    const list = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
    const idx = list.indexOf(document.activeElement as HTMLButtonElement);
    list[(idx + dir + list.length) % list.length]?.focus();
  };

  return (
    <div ref={wrap} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex"
      >
        {trigger({ open })}
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            id={id}
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                move(1);
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                move(-1);
              }
            }}
            className={cn(
              "absolute top-full z-40 mt-1.5 min-w-[200px] overflow-hidden rounded-lg border border-line bg-surface p-1 shadow-raised",
              align === "end" ? "right-0 origin-top-right" : "left-0 origin-top-left",
            )}
          >
            {items.map((item, i) => (
              <button
                key={item.label}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm outline-none transition-colors focus:bg-sand disabled:opacity-40",
                  item.danger ? "text-danger hover:bg-danger-soft focus:bg-danger-soft" : "text-charcoal hover:bg-sand",
                )}
              >
                {item.icon ? <Icon name={item.icon} size={16} /> : null}
                {item.label}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
