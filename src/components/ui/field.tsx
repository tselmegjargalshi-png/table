"use client";

import { createContext, forwardRef, useContext, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

const FieldCtx = createContext<{ id: string; describedBy?: string; invalid: boolean } | null>(null);

export function Field({
  label,
  hint,
  error,
  children,
  className,
  optional,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
  optional?: boolean;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const describedBy = [hint ? hintId : null, error ? errId : null].filter(Boolean).join(" ") || undefined;
  return (
    <FieldCtx.Provider value={{ id, describedBy, invalid: Boolean(error) }}>
      <div className={cn("flex flex-col gap-1.5", className)}>
        <label htmlFor={id} className="text-[13px] font-medium text-charcoal">
          {label}
          {optional ? <span className="ml-1 font-normal text-stone-light">(заавал биш)</span> : null}
        </label>
        {children}
        {hint && !error ? (
          <p id={hintId} className="text-xs text-stone">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={errId} role="alert" className="flex items-center gap-1 text-xs text-danger">
            <Icon name="alert" size={13} />
            {error}
          </p>
        ) : null}
      </div>
    </FieldCtx.Provider>
  );
}

const control =
  "w-full rounded-md border border-line bg-surface px-3 text-sm text-ink placeholder:text-stone-light shadow-[inset_0_1px_1px_rgb(22_21_19/0.03)] transition-colors hover:border-line-strong focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/8 disabled:bg-sand disabled:text-stone aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/10";

function useFieldProps(id?: string) {
  const ctx = useContext(FieldCtx);
  return {
    id: id ?? ctx?.id,
    "aria-describedby": ctx?.describedBy,
    "aria-invalid": ctx?.invalid || undefined,
  };
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { leading?: ReactNode; trailing?: ReactNode }>(
  function Input({ className, leading, trailing, id, ...rest }, ref) {
    const fp = useFieldProps(id);
    if (leading || trailing) {
      return (
        <div className="relative">
          {leading ? <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-stone">{leading}</span> : null}
          <input ref={ref} className={cn(control, "h-10", leading ? "pl-9" : "", trailing ? "pr-10" : "", className)} {...fp} {...rest} />
          {trailing ? <span className="absolute inset-y-0 right-3 flex items-center text-sm text-stone">{trailing}</span> : null}
        </div>
      );
    }
    return <input ref={ref} className={cn(control, "h-10", className)} {...fp} {...rest} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, id, rows = 3, ...rest },
  ref,
) {
  const fp = useFieldProps(id);
  return <textarea ref={ref} rows={rows} className={cn(control, "resize-y py-2.5 leading-relaxed", className)} {...fp} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, id, children, ...rest },
  ref,
) {
  const fp = useFieldProps(id);
  return (
    <div className="relative">
      <select ref={ref} className={cn(control, "h-10 appearance-none pr-9", className)} {...fp} {...rest}>
        {children}
      </select>
      <Icon name="chevronDown" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone" />
    </div>
  );
});

/** Төгрөгийн дүн оруулах талбар */
export function MoneyInput({
  value,
  onChange,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & { value: number; onChange: (v: number) => void }) {
  return (
    <Input
      inputMode="numeric"
      value={value ? new Intl.NumberFormat("en-US").format(value) : ""}
      onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "")) || 0)}
      trailing="₮"
      {...rest}
    />
  );
}
