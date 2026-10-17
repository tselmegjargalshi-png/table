"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/field";
import { api, ClientError } from "@/lib/client/fetcher";

export function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function go(promise: Promise<{ redirect: string }>) {
    try {
      const { redirect } = await promise;
      router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : redirect);
      router.refresh();
    } catch (err) {
      const ce = err as ClientError;
      setError(ce.message);
      setFields(ce.fields ?? {});
      setBusy(false);
      setDemoBusy(null);
    }
  }

  return (
    <div>
      {sp.get("reset") ? <p className="mb-5 rounded-md border border-success/20 bg-success-soft px-3 py-2 text-sm text-success">Нууц үг амжилттай шинэчлэгдлээ.</p> : null}
      <form
        className="space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          setFields({});
          void go(api<{ redirect: string }>("/api/auth/login", { body: { email, password } }));
        }}
      >
        <Field label="Имэйл" error={fields.email}>
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@restaurant.mn" data-autofocus />
        </Field>
        <Field label="Нууц үг" error={fields.password}>
          <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-[13px] text-stone underline underline-offset-4 hover:text-ink">
            Нууц үгээ мартсан уу?
          </Link>
        </div>
        {error ? <ErrorNotice message={error} /> : null}
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Нэвтрэх
        </Button>
      </form>

      <div className="my-7 flex items-center gap-3 text-xs text-stone-light">
        <span className="h-px flex-1 bg-line" />
        Демо ресторан туршиж үзэх
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="grid gap-2">
        {(
          [
            ["owner", "Эзэмшигчээр орох", "Хянах самбар, тайлан, тохиргоо"],
            ["kitchen", "Гал тогоогоор орох", "Гал тогооны дэлгэц"],
          ] as const
        ).map(([as, label, hint]) => (
          <Button
            key={as}
            variant="secondary"
            size="lg"
            className="!h-auto justify-between !py-3 text-left"
            loading={demoBusy === as}
            disabled={Boolean(demoBusy) || busy}
            onClick={() => {
              setDemoBusy(as);
              setError(null);
              void go(api<{ redirect: string }>("/api/auth/demo", { body: { as } }));
            }}
            iconRight="arrowRight"
          >
            <span className="flex flex-col items-start">
              <span>{label}</span>
              <span className="text-xs font-normal text-stone">{hint}</span>
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
