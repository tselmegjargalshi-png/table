"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { api, ClientError } from "@/lib/client/fetcher";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [sent, setSent] = useState<{ devLink: string | null } | null>(null);

  if (sent) {
    return (
      <div className="rounded-lg border border-line bg-surface p-5">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-success-soft text-success">
          <Icon name="mail" size={18} />
        </div>
        <p className="font-semibold">Хүсэлт илгээгдлээ</p>
        <p className="mt-1 text-sm text-stone">Хэрэв {email} имэйл бүртгэлтэй бол нууц үг сэргээх холбоос очно. Холбоос 1 цагийн хугацаатай.</p>
        {sent.devLink ? (
          <p className="mt-4 rounded-md border border-warning/25 bg-warning-soft p-3 text-xs text-warning">
            Имэйл үйлчилгээ холбогдоогүй тул холбоосыг энд харууллаа:
            <Link href={sent.devLink} className="mt-1 block break-all font-medium underline">
              {sent.devLink}
            </Link>
          </p>
        ) : null}
        <Link href="/login" className="mt-5 inline-block text-sm font-medium underline underline-offset-4">
          Нэвтрэх хуудас руу буцах
        </Link>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        setFieldError(undefined);
        try {
          setSent(await api<{ devLink: string | null }>("/api/auth/forgot", { body: { email } }));
        } catch (err) {
          const ce = err as ClientError;
          setError(ce.message);
          setFieldError(ce.fields?.email);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Field label="Имэйл" error={fieldError}>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" data-autofocus />
      </Field>
      {error && !fieldError ? <ErrorNotice message={error} /> : null}
      <Button type="submit" size="lg" className="w-full" loading={busy}>
        Сэргээх холбоос илгээх
      </Button>
      <Link href="/login" className="block text-center text-sm text-stone underline underline-offset-4 hover:text-ink">
        Буцах
      </Link>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        setFieldError(undefined);
        try {
          const { redirect } = await api<{ redirect: string }>("/api/auth/reset", { body: { token, password } });
          window.location.assign(redirect);
        } catch (err) {
          const ce = err as ClientError;
          setError(ce.message);
          setFieldError(ce.fields?.password);
          setBusy(false);
        }
      }}
    >
      <Field label="Шинэ нууц үг" hint="Хамгийн багадаа 8 тэмдэгт" error={fieldError}>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" data-autofocus />
      </Field>
      {error && !fieldError ? <ErrorNotice message={error} /> : null}
      <Button type="submit" size="lg" className="w-full" loading={busy}>
        Нууц үг шинэчлэх
      </Button>
    </form>
  );
}
