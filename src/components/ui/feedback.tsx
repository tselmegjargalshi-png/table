import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./icon";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-sand", className)} aria-hidden="true" />;
}

export function EmptyState({
  icon = "info",
  title,
  description,
  action,
  className,
  tone = "light",
}: {
  icon?: IconName;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <div
        className={cn(
          "mb-4 flex h-12 w-12 items-center justify-center rounded-lg border",
          tone === "dark" ? "border-kds-line bg-kds-card text-kds-muted" : "border-line bg-sand text-stone",
        )}
      >
        <Icon name={icon} size={22} />
      </div>
      <p className={cn("text-[15px] font-semibold", tone === "dark" ? "text-kds-text" : "text-ink")}>{title}</p>
      {description ? <p className={cn("mt-1 max-w-sm text-sm", tone === "dark" ? "text-kds-muted" : "text-stone")}>{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-center justify-between gap-3 rounded-md border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
      <span className="flex items-center gap-2">
        <Icon name="alert" size={16} />
        {message}
      </span>
      {onRetry ? (
        <button onClick={onRetry} className="font-medium underline underline-offset-2">
          Дахин оролдох
        </button>
      ) : null}
    </div>
  );
}
