"use client";

import { useMemo, useState } from "react";
import { Button, IconButton } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { api, ClientError } from "@/lib/client/fetcher";
import { formatDate, formatTime, ubParts } from "@/lib/format";

const pad = (n: number) => String(n).padStart(2, "0");

function ubTodayIso() {
  const p = ubParts(new Date());
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

const SLOTS = Array.from({ length: 28 }, (_, i) => {
  const mins = 9 * 60 + i * 30;
  return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
});

export function ReservationForm({ slug, onDone }: { slug: string; onDone: () => void }) {
  const today = useMemo(() => ubTodayIso(), []);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [party, setParty] = useState(2);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("19:00");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [done, setDone] = useState<{ startsAt: string; partySize: number } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFields({});
    try {
      const res = await api<{ startsAt: string; partySize: number }>(`/api/public/${slug}/reservations`, {
        body: { name, phone, partySize: party, startsAt: `${date}T${time}:00+08:00`, note: note || null },
      });
      setDone(res);
    } catch (err) {
      const ce = err as ClientError;
      setError(ce.message);
      setFields(ce.fields ?? {});
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="py-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success">
          <Icon name="check" size={26} strokeWidth={2} />
        </div>
        <p className="font-serif text-xl">Захиалга хүлээн авлаа.</p>
        <p className="mt-2 text-sm text-stone">
          {formatDate(done.startsAt)}, {formatTime(done.startsAt)} цагт {done.partySize} хүний ширээ. Ресторан таны захиалгыг утсаар баталгаажуулна.
        </p>
        <Button className="mt-6" variant="secondary" onClick={onDone}>
          Хаах
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Нэр" error={fields.name}>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" data-autofocus />
        </Field>
        <Field label="Утасны дугаар" error={fields.phone}>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="9911 2233" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Огноо" error={fields.startsAt}>
          <Input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Цаг">
          <Select value={time} onChange={(e) => setTime(e.target.value)}>
            {SLOTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Хүний тоо" error={fields.partySize}>
          <div className="flex h-10 items-center justify-between rounded-md border border-line bg-surface px-1">
            <IconButton icon="minus" label="Хүн хасах" size="sm" onClick={() => setParty((p) => Math.max(1, p - 1))} />
            <span className="tabular text-sm font-semibold" aria-live="polite">{party}</span>
            <IconButton icon="plus" label="Хүн нэмэх" size="sm" onClick={() => setParty((p) => Math.min(60, p + 1))} />
          </div>
        </Field>
      </div>
      <Field label="Нэмэлт хүсэлт" optional>
        <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Жишээ нь: цонхны дэргэд суух" />
      </Field>
      {error ? <ErrorNotice message={error} /> : null}
      <Button type="submit" size="lg" className="w-full" loading={busy}>
        Захиалга илгээх
      </Button>
    </form>
  );
}
