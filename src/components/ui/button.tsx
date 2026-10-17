"use client";

import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./icon";
import { Spinner } from "./spinner";

type Variant = "primary" | "accent" | "secondary" | "ghost" | "danger" | "subtle";
type Size = "xs" | "sm" | "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium select-none transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out active:translate-y-px disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-charcoal shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]",
  accent: "bg-ember text-white hover:bg-ember-dark shadow-[inset_0_1px_0_rgb(255_255_255/0.14)]",
  secondary: "bg-surface text-ink border border-line hover:border-line-strong hover:bg-white shadow-soft",
  ghost: "text-charcoal hover:bg-sand",
  subtle: "bg-sand text-ink hover:bg-beige",
  danger: "bg-surface text-danger border border-line hover:border-danger/40 hover:bg-danger-soft",
};

const sizes: Record<Size, string> = {
  xs: "h-7 px-2.5 text-xs rounded-sm",
  sm: "h-8 px-3 text-[13px] rounded-sm",
  md: "h-10 px-4 text-sm rounded-md",
  lg: "h-12 px-5 text-[15px] rounded-md",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: IconName;
  iconRight?: IconName;
  children?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, icon, iconRight, className, children, disabled, type = "button", ...rest },
  ref,
) {
  const iconSize = size === "lg" ? 18 : size === "md" ? 16 : 14;
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner size={iconSize} /> : icon ? <Icon name={icon} size={iconSize} /> : null}
      {children}
      {iconRight && !loading ? <Icon name={iconRight} size={iconSize} /> : null}
    </button>
  );
});

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size; icon?: IconName; iconRight?: IconName };

export function ButtonLink({ variant = "primary", size = "md", icon, iconRight, className, children, ...rest }: ButtonLinkProps) {
  const iconSize = size === "lg" ? 18 : size === "md" ? 16 : 14;
  return (
    <Link className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {icon ? <Icon name={icon} size={iconSize} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={iconSize} /> : null}
    </Link>
  );
}

export function IconButton({
  icon,
  label,
  size = "md",
  variant = "ghost",
  className,
  ...rest
}: Omit<ButtonProps, "children" | "icon"> & { icon: IconName; label: string }) {
  const dims = size === "lg" ? "h-12 w-12" : size === "md" ? "h-10 w-10" : size === "sm" ? "h-8 w-8" : "h-7 w-7";
  return (
    <Button variant={variant} size={size} aria-label={label} title={label} className={cn("px-0", dims, className)} {...rest}>
      <Icon name={icon} size={size === "lg" ? 20 : size === "xs" ? 14 : 18} />
    </Button>
  );
}
