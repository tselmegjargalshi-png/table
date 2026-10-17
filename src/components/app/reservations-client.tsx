"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { EmptyState, ErrorNotice } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { api, ClientError } from "@/lib/client/fetcher";
import { formatDate, formatPhone, formatTime, ubParts, WEEKDAYS } from "@/lib/format";
import { RESERVATION_STATUS } from "@/lib/labels";
import type { ReservationDTO, ReservationRange } from "@/server/services/reservations";

type Counts = { today: number; tomorrow: number; week: number };
type TableOpt = { id: string; number: number; seats: number };
const pad = (n: number) => String(n).padStart(2, "0");

export function ReservationsClient({ initial, counts: initialCounts, tables }: { initial: ReservationDTO[]; counts: Counts; tables: TableOpt[] }) {
  const toast = useToast();
  const [range, setRange] = useState<ReservationRange>("today");
  const [items, setItems] = useState(initial);
  const [counts, setCounts] = useState(initialCounts);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ReservationDTO | "new" | null>(null);
  const first = useRef(true);

  async function load(r: ReservationRange) {
    try {
      const res = await api<{ items: ReservationDTO[]; counts: Counts }>(`/api/staff/reservations?range=${r}`);
      setItems(res.items);
      setCounts(res.counts);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    void load(range);
  }, [range]);

  async function setStatus(r: ReservationDTO, status: ReservationDTO["status"], tableId?: string | null) {
    try {
      await api(`/api/staff/reservations/${r.id}`, { method: "PATCH", body: { status, ...(tableId !== undefined ? { tableId } : {}) } });
      toast.success(`${r.name}: ${RESERVATION_STATUS[status].label}`);
      await load(range);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const groups = (() => {
    const map = new Map<string, ReservationDTO[]>();
    for (const r of items) {
      const p = ubParts(r.startsAt);
      const key = `${p.year}-${pad(p.month)}-${pad(p.day)}`;
      map.set(key, [...(map.get(key) ?? []), r]);
    }
    return [...map.entries()];
  })();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Хугацаа"
          value={range}
          onChange={setRange}
          options={[
            { value: "today", label: "Өнөөдөр", count: counts.today },
            { value: "tomorrow", label: "Маргааш", count: counts.tomorrow },
            { value: "week", label: "Энэ долоо хоног", count: counts.week },
          ]}
        />
        <Button icon="plus" onClick={() => setForm("new")}>Захиалга нэмэх</Button>
      </div>
      {error ? <ErrorNotice message={error} onRetry={() => void load(range)} /> : null}

      {items.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface">
          <EmptyState icon="calendar" title="Энэ хугацаанд захиалга алга" description="Утсаар эсвэл меню хуудсаар ирсэн ширээний захиалга энд харагдана." action={<Button variant="secondary" icon="plus" onClick={() => setForm("new")}>Захиалга нэмэх</Button>} />
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([key, list]) => {
            const d = new Date(`${key}T12:00:00+08:00`);
            return (
              <section key={key} aria-label={formatDate(d)}>
                {range === "week" ? <h2 className="mb-3 text-sm font-semibold text-stone">{WEEKDAYS[ubParts(d).weekday]}, {formatDate(d)}</h2> : null}
                <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <AnimatePresence initial={false}>
                    {list.map((r) => (
                      <motion.li key={r.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col rounded-lg border border-line bg-surface shadow-soft">
                        <div className="flex gap-4 p-4">
                          <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-md bg-sand py-2">
                            <span className="tabular text-xl font-semibold leading-none">{formatTime(r.startsAt)}</span>
                            <span className="mt-1 text-[11px] text-stone">{r.durationMin} мин</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="truncate font-semibold">{r.name}</p>
                              <Badge tone={RESERVATION_STATUS[r.status].tone} dot size="sm">{RESERVATION_STATUS[r.status].label}</Badge>
                            </div>
                            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-stone">
                              <span className="flex items-center gap-1"><Icon name="users" size={13} />{r.partySize} хүн</span>
                              <span className="flex items-center gap-1"><Icon name="seat" size={13} />{r.table ? `Ширээ ${r.table.number}` : "Ширээ оноогоогүй"}</span>
                            </p>
                            <a href={`tel:${r.phone}`} className="mt-1 inline-flex items-center gap-1 text-[13px] text-stone hover:text-ink"><Icon name="phone" size={13} />{formatPhone(r.phone)}</a>
                            {r.note ? <p className="mt-2 text-xs italic text-stone">«{r.note}»</p> : null}
                            {r.source === "online" ? <p className="mt-1.5 text-[11px] text-info">Онлайнаар ирсэн</p> : null}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 border-t border-line px-3 py-2.5">
                          {r.status === "PENDING" ? <Button size="sm" onClick={() => void setStatus(r, "CONFIRMED")}>Баталгаажуулах</Button> : null}
                          {r.status === "CONFIRMED" ? <Button size="sm" onClick={() => void setStatus(r, "ARRIVED")}>Ирсэн</Button> : null}
                          {r.status === "CANCELLED" ? <Button size="sm" variant="secondary" onClick={() => void setStatus(r, "PENDING")}>Сэргээх</Button> : null}
                          <span className="ml-auto flex items-center gap-1">
                            {r.status !== "CANCELLED" && r.status !== "ARRIVED" ? <Button size="sm" variant="ghost" onClick={() => void setStatus(r, "CANCELLED")}>Цуцлах</Button> : null}
                            <IconButton icon="edit" label={`${r.name} засах`} size="sm" onClick={() => setForm(r)} />
                          </span>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <ReservationForm
        value={form}
        tables={tables}
        onClose={() => setForm(null)}
        onSaved={async () => {
          setForm(null);
          await load(range);
        }}
      />
    </div>
  );
}

function ReservationForm({ value, tables, onClose, onSaved }: { value: ReservationDTO | "new" | null; tables: TableOpt[]; onClose: () => void; onSaved: () => void | Promise<void> }) {
  const editing = value && value !== "new" ? value : null;
  const toast = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [party, setParty] = useState("2");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [duration, setDuration] = useState("90");
  const [tableId, setTableId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [key, setKey] = useState<string | null>(null);

  const k = value === null ? null : editing ? editing.id : "new";
  if (k !== key) {
    setKey(k);
    const base = editing ? new Date(editing.startsAt) : new Date();
    const p = ubParts(base);
    setName(editing?.name ?? "");
    setPhone(editing?.phone ?? "");
    setParty(String(editing?.partySize ?? 2));
    setDate(`${p.year}-${pad(p.month)}-${pad(p.day)}`);
    setTime(editing ? `${pad(p.hour)}:${pad(p.minute)}` : "19:00");
    setDuration(String(editing?.durationMin ?? 90));
    setTableId(editing?.table?.id ?? "");
    setNote(editing?.note ?? "");
    setError(null);
    setFields({});
  }

  return (
    <Modal open={value !== null} onClose={onClose} title={editing ? "Захиалга засах" : "Шинэ захиалга"} size="md">
      <form
        noValidate
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          setFields({});
          try {
            const body = { name, phone, partySize: Number(party) || 0, startsAt: `${date}T${time}:00+08:00`, durationMin: Number(duration) || 90, tableId: tableId || null, note: note || null };
            if (editing) await api(`/api/staff/reservations/${editing.id}`, { method: "PUT", body });
            else await api("/api/staff/reservations", { body });
            toast.success(editing ? "Захиалга шинэчлэгдлээ" : "Захиалга нэмэгдлээ");
            await onSaved();
          } catch (err) {
            const ce = err as ClientError;
            setError(ce.message);
            setFields(ce.fields ?? {});
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Нэр" error={fields.name}><Input value={name} onChange={(e) => setName(e.target.value)} data-autofocus /></Field>
          <Field label="Утасны дугаар" error={fields.phone}><Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="9911 2233" /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Огноо" error={fields.startsAt} className="sm:col-span-2"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Цаг"><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} step={900} /></Field>
          <Field label="Хүний тоо" error={fields.partySize}><Input inputMode="numeric" value={party} onChange={(e) => setParty(e.target.value.replace(/\D/g, ""))} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ширээ" optional>
            <Select value={tableId} onChange={(e) => setTableId(e.target.value)}>
              <option value="">Дараа оноох</option>
              {tables.map((t) => <option key={t.id} value={t.id}>Ширээ {t.number} ({t.seats} суудал)</option>)}
            </Select>
          </Field>
          <Field label="Үргэлжлэх хугацаа">
            <Select value={duration} onChange={(e) => setDuration(e.target.value)}>
              {[60, 90, 120, 150, 180].map((m) => <option key={m} value={m}>{m} минут</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Тэмдэглэл" optional><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} /></Field>
        {error ? <ErrorNotice message={error} /> : null}
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Болих</Button><Button type="submit" loading={busy}>Хадгалах</Button></div>
      </form>
    </Modal>
  );
}
