import { cn } from "@/lib/cn";

/** TABLE.MN: дээрээс харсан ширээний тэмдэг ба үгэн тэмдэг */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#161513" />
      <rect x="7" y="10" width="18" height="3.2" rx="1.6" fill="#f6f3ee" />
      <rect x="14.4" y="13" width="3.2" height="10" rx="1.6" fill="#f6f3ee" />
      <circle cx="25" cy="24.5" r="2.2" fill="#b4532a" />
    </svg>
  );
}

export function Logo({ className, tone = "dark", size = 28 }: { className?: string; tone?: "dark" | "light"; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      <span className={cn("text-[15px] font-semibold tracking-[0.02em]", tone === "dark" ? "text-ink" : "text-kds-text")}>
        TABLE<span className="text-ember">.</span>MN
      </span>
    </span>
  );
}

/** Рестораны лого: зураг байхгүй бол товчилсон үсэг */
export function RestaurantMark({ name, text, color, size = 44, className }: { name: string; text?: string | null; color: string; size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-lg font-serif font-semibold text-white", className)}
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.38 }}
      aria-hidden="true"
      title={name}
    >
      {(text || name).slice(0, 2).toUpperCase()}
    </span>
  );
}
