import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  icon,
  delta,
  hint,
  tone,
}: {
  label: string;
  value: ReactNode;
  icon: IconName;
  delta?: number | null;
  hint?: ReactNode;
  tone?: "accent";
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-stone">{label}</p>
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", tone === "accent" ? "bg-ember-soft text-ember" : "bg-sand text-stone")}>
          <Icon name={icon} size={15} />
        </span>
      </div>
      <p className="tabular mt-2.5 text-[26px] font-semibold leading-none tracking-[-0.02em] sm:text-[28px]">{value}</p>
      <div className="mt-2 flex min-h-5 items-center gap-2 text-xs">
        {delta !== undefined && delta !== null ? (
          <span className={cn("tabular inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-medium", delta > 0 ? "bg-success-soft text-success" : delta < 0 ? "bg-danger-soft text-danger" : "bg-sand text-stone")}>
            <Icon name={delta >= 0 ? "chevronUp" : "chevronDown"} size={12} strokeWidth={2.2} />
            {Math.abs(delta)}%
          </span>
        ) : null}
        {hint ? <span className="text-stone">{hint}</span> : null}
      </div>
    </Card>
  );
}
