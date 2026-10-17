"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { api, ClientError } from "@/lib/client/fetcher";

export function RegisterForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [type, setType] = useState<"owner" | "customer">(sp.get("type") === "customer" ? "customer" : "owner");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFields({});
    try {
      const { redirect } = await api<{ redirect: string }>("/api/auth/register", { body: { name, email, phone, password, accountType: type } });
      router.push(redirect);
      router.refresh();
    } catch (err) {
      const ce = err as ClientError;
      setError(ce.message);
      setFields(ce.fields ?? {});
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div role="radiogroup" aria-label="Бүртгэлийн төрөл" className="grid grid-cols-2 gap-2">
        {(
          [
            ["owner", "Ресторан", "store"],
            ["customer", "Үйлчлүүлэгч", "users"],
          ] as const
        ).map(([v, label, icon]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={type === v}
            onClick={() => setType(v)}
            className={cn("flex items-center gap-2 rounded-md border px-3 py-3 text-sm font-medium transition-colors", type === v ? "border-ink bg-ink text-paper" : "border-line bg-surface hover:border-line-strong")}
          >
            <Icon name={icon} size={16} />
            {label}
          </button>
        ))}
      </div>
      <Field label={type === "owner" ? "Таны нэр" : "Нэр"} error={fields.name}>
        <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" data-autofocus />
      </Field>
      <Field label="Имэйл" error={fields.email}>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </Field>
      <Field label="Утасны дугаар" optional error={fields.phone}>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="9911 2233" />
      </Field>
      <Field label="Нууц үг" hint="Хамгийн багадаа 8 тэмдэгт" error={fields.password}>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
      </Field>
      {error ? <ErrorNotice message={error} /> : null}
      <Button type="submit" size="lg" className="w-full" loading={busy}>
        {type === "owner" ? "Ресторанаа бүртгүүлэх" : "Бүртгүүлэх"}
      </Button>
    </form>
  );
}
