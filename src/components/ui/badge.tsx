import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/labels";

const tones: Record<Tone, string> = {
  neutral: "bg-sand text-charcoal border-line",
  muted: "bg-transparent text-stone border-line",
  accent: "bg-ember-soft text-ember-dark border-ember/20",
  info: "bg-info-soft text-info border-info/15",
  warning: "bg-warning-soft text-warning border-warning/20",
  success: "bg-success-soft text-success border-success/15",
  danger: "bg-danger-soft text-danger border-danger/15",
};

const dots: Record<Tone, string> = {
  neutral: "bg-stone",
  muted: "bg-stone-light",
  accent: "bg-ember",
  info: "bg-info",
  warning: "bg-warning",
  success: "bg-success",
  danger: "bg-danger",
};

export function Badge({ tone = "neutral", children, dot, className, size = "md" }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string; size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border font-medium",
        size === "sm" ? "px-1.5 py-px text-[11px]" : "px-2 py-0.5 text-xs",
        tones[tone],
        className,
      )}
    >
      {dot ? <span className={cn("h-1.5 w-1.5 rounded-full", dots[tone])} /> : null}
      {children}
    </span>
  );
}

export function StatusDot({ tone, pulse }: { tone: Tone; pulse?: boolean }) {
  return <span className={cn("inline-block h-2 w-2 rounded-full", dots[tone], pulse && "animate-pulse-soft")} aria-hidden="true" />;
}
