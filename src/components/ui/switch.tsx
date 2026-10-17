"use client";

import { cn } from "@/lib/cn";

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  size = "md",
  hideLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  hideLabel?: boolean;
}) {
  const track = size === "sm" ? "h-5 w-9" : "h-6 w-11";
  const knob = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const shift = size === "sm" ? "translate-x-4" : "translate-x-5";
  return (
    <label className={cn("inline-flex items-start gap-3", disabled ? "opacity-50" : "cursor-pointer")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={hideLabel ? label : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative shrink-0 rounded-full p-0.5 transition-colors duration-200",
          track,
          checked ? "bg-success" : "bg-line-strong",
        )}
      >
        <span className={cn("block rounded-full bg-white shadow-sm transition-transform duration-200 ease-out", knob, checked ? shift : "translate-x-0")} />
      </button>
      {!hideLabel ? (
        <span className="flex flex-col">
          <span className="text-sm font-medium text-ink">{label}</span>
          {description ? <span className="text-xs text-stone">{description}</span> : null}
        </span>
      ) : null}
    </label>
  );
}
