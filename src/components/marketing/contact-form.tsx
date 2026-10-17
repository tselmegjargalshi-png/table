"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/feedback";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { api, ClientError } from "@/lib/client/fetcher";

export function ContactForm() {
  const [v, setV] = useState({ name: "", phone: "", email: "", restaurant: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV((s) => ({ ...s, [k]: e.target.value }));

  if (done) {
    return (
      <div className="rounded-xl border border-success/25 bg-success-soft p-8 text-center" role="status">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-success text-white">
          <Icon name="check" size={20} />
        </span>
        <p className="mt-4 font-serif text-xl">Хүсэлт хүлээн авлаа</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-stone">Манай баг таны утсаар эргэн холбогдоно. Баярлалаа.</p>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        setFields({});
        try {
          await api("/api/contact", { body: v });
          setDone(true);
        } catch (err) {
          const ce = err as ClientError;
          setError(ce.message);
          setFields(ce.fields ?? {});
        } finally {
          setBusy(false);
        }
      }}
    >
      <Field label="Таны нэр" error={fields.name}>
        <Input value={v.name} onChange={set("name")} autoComplete="name" />
      </Field>
      <Field label="Утасны дугаар" error={fields.phone}>
        <Input type="tel" value={v.phone} onChange={set("phone")} autoComplete="tel" placeholder="9911 2233" />
      </Field>
      <Field label="Имэйл" optional error={fields.email}>
        <Input type="email" value={v.email} onChange={set("email")} autoComplete="email" />
      </Field>
      <Field label="Рестораны нэр" optional error={fields.restaurant}>
        <Input value={v.restaurant} onChange={set("restaurant")} />
      </Field>
      <Field label="Таны асуулт" optional error={fields.message} className="sm:col-span-2">
        <Textarea value={v.message} onChange={set("message")} rows={4} placeholder="Рестораныхаа талаар товч бичнэ үү" />
      </Field>
      {error ? (
        <div className="sm:col-span-2">
          <ErrorNotice message={error} />
        </div>
      ) : null}
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" loading={busy} iconRight="arrowRight">
          Хүсэлт илгээх
        </Button>
      </div>
    </form>
  );
}
