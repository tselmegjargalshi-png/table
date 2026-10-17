"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { api } from "@/lib/client/fetcher";
import { useNow, usePoll } from "@/lib/client/use-poll";
import { formatDuration, formatMoney, formatTime } from "@/lib/format";
import { ORDER_STATUS, TABLE_STATUS, type Tone } from "@/lib/labels";
import type { TableDTO } from "@/server/services/tables";

type TableStatus = TableDTO["status"];

const FACE: Record<TableStatus, { top: string; edge: string; ring: string; text: string }> = {
  FREE: { top: "#f3f7f2", edge: "#c9d8cc", ring: "#2f6b4f", text: "#2f6b4f" },
  RESERVED: { top: "#eef3f8", edge: "#c6d4e1", ring: "#2f5877", text: "#2f5877" },
  SEATED: { top: "#faf1dc", edge: "#e6d3a5", ring: "#9a6312", text: "#9a6312" },
  ORDERED: { top: "#f8e6da", edge: "#e8c3aa", ring: "#b4532a", text: "#8f3f1e" },
  AWAITING_PAYMENT: { top: "#f7e1de", edge: "#e8b9b3", ring: "#a3352b", text: "#a3352b" },
};

const STATUS_ORDER: TableStatus[] = ["FREE", "RESERVED", "SEATED", "ORDERED", "AWAITING_PAYMENT"];

export function TablesClient({ initial, canManage }: { initial: TableDTO[]; canManage: boolean }) {
  const { data, setData, error, refresh } = usePoll<TableDTO[]>("/api/staff/tables", initial, 6000);
  const now = useNow(15000);
  const toast = useToast();
  const [view, setView] = useState<"plan" | "list">("plan");
  const [zone, setZone] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formOpen, setFormOpen] = useState<TableDTO | "new" | null>(null);

  // Жижиг дэлгэцэнд жагсаалтаар эхэлнэ
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.matchMedia("(max-width: 767px)").matches) setView("list");
  }, []);

  const zones = useMemo(() => [...new Set(data.map((t) => t.zone))], [data]);
  const visible = zone === "all" ? data : data.filter((t) => t.zone === zone);
  const selected = data.find((t) => t.id === selectedId) ?? null;
  const counts = useMemo(() => Object.fromEntries(STATUS_ORDER.map((s) => [s, data.filter((t) => t.status === s).length])) as Record<TableStatus, number>, [data]);
  const seatsTotal = data.reduce((s, t) => s + t.seats, 0);
  const seatsUsed = data.filter((t) => t.status !== "FREE").reduce((s, t) => s + t.seats, 0);

  async function move(id: string, posX: number, posY: number) {
    const t = data.find((x) => x.id === id);
    if (!t) return;
    setData((list) => list.map((x) => (x.id === id ? { ...x, posX, posY } : x)));
    try {
      await api(`/api/staff/tables/${id}`, { method: "PUT", body: { number: t.number, seats: t.seats, zone: t.zone, shape: t.shape, posX, posY } });
    } catch (e) {
      toast.error((e as Error).message);
      void refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {STATUS_ORDER.map((s) => (
          <div key={s} className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3.5 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: FACE[s].ring }} />
            <div>
              <p className="tabular text-lg font-semibold leading-none">{counts[s]}</p>
              <p className="mt-1 text-[11px] leading-tight text-stone">{TABLE_STATUS[s].label}</p>
            </div>
          </div>
        ))}
        <div className="rounded-lg border border-line bg-surface px-3.5 py-2.5">
          <p className="tabular text-lg font-semibold leading-none">{seatsTotal ? Math.round((seatsUsed / seatsTotal) * 100) : 0}%</p>
          <p className="mt-1 text-[11px] leading-tight text-stone">Суудлын дүүргэлт</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label="Харагдац"
            value={view}
            onChange={setView}
            options={[
              { value: "plan", label: "Зураглал" },
              { value: "list", label: "Жагсаалт" },
            ]}
          />
          {zones.length > 1 ? (
            <Segmented label="Бүс" value={zone} onChange={setZone} options={[{ value: "all", label: "Бүгд" }, ...zones.map((z) => ({ value: z, label: z }))]} />
          ) : null}
        </div>
        {canManage ? (
          <div className="flex items-center gap-2">
            {view === "plan" ? (
              <Button variant={editMode ? "primary" : "secondary"} size="sm" icon="grip" onClick={() => setEditMode((v) => !v)} aria-pressed={editMode}>
                {editMode ? "Байршил засаж байна" : "Байршил засах"}
              </Button>
            ) : null}
            <Button size="sm" icon="plus" onClick={() => setFormOpen("new")}>Ширээ нэмэх</Button>
          </div>
        ) : null}
      </div>

      {error ? <ErrorNotice message={error} onRetry={() => void refresh()} /> : null}

      {view === "plan" ? (
        <FloorPlan tables={visible} now={now} onSelect={(id) => setSelectedId(id)} editMode={editMode} onMove={move} />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((t) => (
            <li key={t.id}>
              <button onClick={() => setSelectedId(t.id)} className="flex h-full w-full flex-col rounded-lg border border-line bg-surface p-3.5 text-left shadow-soft transition-colors hover:border-line-strong" style={{ borderTopColor: FACE[t.status].ring, borderTopWidth: 3 }}>
                <div className="flex items-baseline justify-between">
                  <span className="tabular text-2xl font-semibold">{t.number}</span>
                  <span className="flex items-center gap-1 text-xs text-stone"><Icon name="seat" size={13} />{t.seats}</span>
                </div>
                <Badge tone={TABLE_STATUS[t.status].tone} className="mt-2 self-start" size="sm">{TABLE_STATUS[t.status].label}</Badge>
                <p className="mt-auto pt-3 text-xs text-stone">
                  {t.occupiedAt ? <>{formatDuration(now - new Date(t.occupiedAt).getTime())}</> : t.zone}
                  {t.orderTotal > 0 ? <span className="tabular ml-1 font-medium text-ink">· {formatMoney(t.orderTotal)}</span> : null}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      <TableDetail
        table={selected}
        now={now}
        canManage={canManage}
        onClose={() => setSelectedId(null)}
        onChanged={() => void refresh()}
        onEdit={(t) => {
          setSelectedId(null);
          setFormOpen(t);
        }}
      />
      <TableForm
        value={formOpen}
        existing={data}
        onClose={() => setFormOpen(null)}
        onSaved={() => {
          setFormOpen(null);
          void refresh();
        }}
      />
    </div>
  );
}

function FloorPlan({ tables, now, onSelect, editMode, onMove }: { tables: TableDTO[]; now: number; onSelect: (id: string) => void; editMode: boolean; onMove: (id: string, x: number, y: number) => void }) {
  const floor = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null);

  const pointToPercent = (e: React.PointerEvent) => {
    const r = floor.current!.getBoundingClientRect();
    return { x: Math.round(Math.min(96, Math.max(4, ((e.clientX - r.left) / r.width) * 100))), y: Math.round(Math.min(94, Math.max(6, ((e.clientY - r.top) / r.height) * 100))) };
  };

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-gradient-to-b from-sand/70 to-paper p-2 sm:p-6" style={{ perspective: "1600px" }}>
      <div
        ref={floor}
        className="hairline-grid relative mx-auto aspect-[16/10] w-full max-w-[1100px] rounded-xl border border-line-strong bg-[#f1ebe0] shadow-[0_40px_60px_-30px_rgb(22_21_19/0.35)]"
        style={{ transform: "rotateX(22deg) scale(0.98)", transformOrigin: "50% 100%", touchAction: editMode ? "none" : "auto" }}
        onPointerMove={(e) => {
          if (drag) setDrag({ ...drag, ...pointToPercent(e) });
        }}
        onPointerUp={() => {
          if (drag) {
            onMove(drag.id, drag.x, drag.y);
            setDrag(null);
          }
        }}
      >
        <span className="absolute left-3 top-2 select-none text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-light">Хаалга</span>
        {tables.map((t) => {
          const face = FACE[t.status];
          const pos = drag?.id === t.id ? drag : { x: t.posX, y: t.posY };
          const w = t.shape === "RECT" ? "clamp(76px,12%,128px)" : "clamp(54px,8%,84px)";
          const h = t.shape === "RECT" ? "clamp(48px,11%,76px)" : "clamp(54px,9%,84px)";
          const chairs = Math.min(t.seats, t.shape === "RECT" ? 10 : 4);
          return (
            <button
              key={t.id}
              onClick={() => !editMode && onSelect(t.id)}
              onPointerDown={(e) => {
                if (!editMode) return;
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                setDrag({ id: t.id, ...pointToPercent(e) });
              }}
              aria-label={`Ширээ ${t.number}, ${t.seats} суудал, ${TABLE_STATUS[t.status].label}`}
              className={cn("group absolute -translate-x-1/2 -translate-y-1/2 outline-offset-4 transition-[left,top] duration-300", editMode ? "cursor-grab active:cursor-grabbing" : "hover:z-10")}
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: w, height: h, transitionDuration: drag?.id === t.id ? "0ms" : undefined }}
            >
              {Array.from({ length: chairs }).map((_, i) => {
                const side = t.shape === "RECT" ? (i % 2 === 0 ? "top" : "bottom") : (["top", "right", "bottom", "left"] as const)[i % 4];
                const idx = t.shape === "RECT" ? Math.floor(i / 2) : 0;
                const per = t.shape === "RECT" ? Math.ceil(chairs / 2) : 1;
                const frac = t.shape === "RECT" ? (idx + 0.5) / per : 0.5;
                const style: React.CSSProperties =
                  side === "top" ? { left: `${frac * 100}%`, top: -7, transform: "translateX(-50%)", width: 16, height: 7 } :
                  side === "bottom" ? { left: `${frac * 100}%`, bottom: -7, transform: "translateX(-50%)", width: 16, height: 7 } :
                  side === "left" ? { left: -7, top: "50%", transform: "translateY(-50%)", width: 7, height: 16 } :
                  { right: -7, top: "50%", transform: "translateY(-50%)", width: 7, height: 16 };
                return <span key={i} className="absolute rounded-[3px] bg-[#cdbfa8]" style={style} />;
              })}
              <span
                className={cn("relative flex h-full w-full flex-col items-center justify-center overflow-hidden transition-transform duration-200 group-hover:-translate-y-0.5", t.shape === "ROUND" ? "rounded-full" : "rounded-lg")}
                style={{
                  background: face.top,
                  border: `2px solid ${face.ring}`,
                  boxShadow: `0 3px 0 ${face.edge}, 0 6px 0 ${face.edge}, 0 14px 18px -6px rgb(22 21 19 / 0.3)`,
                }}
              >
                <span className="tabular text-[clamp(15px,2.2vw,22px)] font-bold leading-none" style={{ color: face.text }}>{t.number}</span>
                {t.occupiedAt ? (
                  <span className="tabular mt-0.5 hidden text-[10px] font-medium leading-none sm:block" style={{ color: face.text }}>
                    {Math.max(0, Math.round((now - new Date(t.occupiedAt).getTime()) / 60000))} мин
                  </span>
                ) : (
                  <span className="mt-0.5 hidden items-center gap-0.5 text-[10px] leading-none text-stone sm:flex"><Icon name="seat" size={10} />{t.seats}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      {editMode ? <p className="mt-4 text-center text-xs text-stone">Ширээг чирж шилжүүлнэ үү. Байршил автоматаар хадгалагдана.</p> : null}
    </div>
  );
}

function TableDetail({ table, now, canManage, onClose, onChanged, onEdit }: { table: TableDTO | null; now: number; canManage: boolean; onClose: () => void; onChanged: () => void; onEdit: (t: TableDTO) => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function setStatus(status: TableStatus, guestName?: string | null) {
    if (!table) return;
    setBusy(true);
    try {
      await api(`/api/staff/tables/${table.id}`, { method: "PATCH", body: { status, guestName } });
      toast.success(`Ширээ ${table.number}: ${TABLE_STATUS[status].label}`);
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function close(method: "CASH" | "CARD" | "QPAY") {
    if (!table) return;
    setBusy(true);
    try {
      await api(`/api/staff/tables/${table.id}/close`, { body: { method } });
      toast.success(`Ширээ ${table.number}: төлбөр хаагдаж, ширээ чөлөөлөгдлөө`);
      onChanged();
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!table) return;
    try {
      await api(`/api/staff/tables/${table.id}`, { method: "DELETE" });
      toast.success(`Ширээ ${table.number} устгагдлаа`);
      setConfirmDelete(false);
      onChanged();
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
      setConfirmDelete(false);
    }
  }

  const tone: Tone = table ? TABLE_STATUS[table.status].tone : "neutral";
  return (
    <>
      <Modal open={Boolean(table)} onClose={onClose} variant="sheet" title={table ? `Ширээ ${table.number}` : ""} description={table ? `${table.zone}, ${table.seats} суудал` : undefined}>
        {table ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={tone} dot>{TABLE_STATUS[table.status].label}</Badge>
              {table.occupiedAt ? <Badge tone="neutral"><Icon name="clock" size={12} />{formatDuration(now - new Date(table.occupiedAt).getTime())}</Badge> : null}
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-line p-3">
                <dt className="text-xs text-stone">Үйлчлүүлэгч</dt>
                <dd className="mt-1 font-medium">{table.guestName ?? "Бүртгээгүй"}</dd>
              </div>
              <div className="rounded-lg border border-line p-3">
                <dt className="text-xs text-stone">Захиалгын дүн</dt>
                <dd className="tabular mt-1 font-semibold">{formatMoney(table.orderTotal)}</dd>
              </div>
            </dl>

            {table.nextReservation ? (
              <div className="flex items-start gap-3 rounded-lg border border-info/20 bg-info-soft p-3 text-sm text-info">
                <Icon name="calendar" size={16} className="mt-0.5" />
                <p>
                  <span className="font-medium">{formatTime(table.nextReservation.startsAt)}</span> цагт {table.nextReservation.name} ({table.nextReservation.partySize} хүн) захиалгатай
                </p>
              </div>
            ) : null}

            <div>
              <p className="mb-2 text-[13px] font-semibold">Одоогийн захиалга</p>
              {table.orders.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line-strong px-4 py-5 text-center text-sm text-stone">Нээлттэй захиалга алга</p>
              ) : (
                <ul className="space-y-2">
                  {table.orders.map((o) => (
                    <li key={o.id} className="rounded-lg border border-line p-3 text-sm">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="tabular font-semibold">#{o.number}</span>
                        <Badge tone={ORDER_STATUS[o.status].tone} size="sm" dot>{ORDER_STATUS[o.status].label}</Badge>
                      </div>
                      <p className="text-stone">{o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}</p>
                      <p className="tabular mt-1.5 text-right font-medium">{formatMoney(o.total)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p className="mb-2 text-[13px] font-semibold">Үйлдэл</p>
              <div className="grid grid-cols-2 gap-2">
                {table.status === "FREE" || table.status === "RESERVED" ? <Button variant="secondary" onClick={() => void setStatus("SEATED")} loading={busy} icon="seat">Суулгах</Button> : null}
                {table.status === "SEATED" ? <Button variant="secondary" onClick={() => void setStatus("AWAITING_PAYMENT")} loading={busy} icon="wallet">Төлбөр хүлээх</Button> : null}
                {table.status === "FREE" ? <Button variant="secondary" onClick={() => void setStatus("RESERVED")} loading={busy} icon="calendar">Захиалгатай болгох</Button> : null}
                {table.status !== "FREE" && table.orders.length === 0 ? <Button variant="secondary" onClick={() => void setStatus("FREE")} loading={busy} icon="check">Сул болгох</Button> : null}
                <Link href="/app/orders" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-surface text-sm font-medium shadow-soft transition-colors hover:border-line-strong"><Icon name="receipt" size={16} />Захиалгууд</Link>
              </div>
              {table.orders.length > 0 ? (
                <div className="mt-3 rounded-lg bg-sand/60 p-3">
                  <p className="mb-2 text-xs text-stone">Төлбөр хаах (бүх захиалга хүргэгдсэн байх шаардлагатай)</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button size="sm" onClick={() => void close("CASH")} loading={busy}>Бэлэн мөнгө</Button>
                    <Button size="sm" onClick={() => void close("CARD")} loading={busy}>Карт</Button>
                    <Button size="sm" onClick={() => void close("QPAY")} loading={busy}>QPay</Button>
                  </div>
                </div>
              ) : null}
            </div>

            {canManage ? (
              <div className="flex items-center justify-between border-t border-line pt-4">
                <Button variant="ghost" size="sm" icon="edit" onClick={() => onEdit(table)}>Засах</Button>
                <Button variant="danger" size="sm" icon="trash" onClick={() => setConfirmDelete(true)} disabled={table.status !== "FREE"}>Устгах</Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={() => void remove()} danger title={`Ширээ ${table?.number ?? ""}-г устгах уу?`} description="Энэ ширээний QR код мөн хамт устна. Хэвлэсэн QR код ажиллахаа болино." confirmLabel="Устгах" />
    </>
  );
}

function TableForm({ value, existing, onClose, onSaved }: { value: TableDTO | "new" | null; existing: TableDTO[]; onClose: () => void; onSaved: () => void }) {
  const editing = value && value !== "new" ? value : null;
  const toast = useToast();
  const nextNumber = Math.max(0, ...existing.map((t) => t.number)) + 1;
  const [number, setNumber] = useState("");
  const [seats, setSeats] = useState("4");
  const [zone, setZone] = useState("Үндсэн танхим");
  const [shape, setShape] = useState<"ROUND" | "SQUARE" | "RECT">("SQUARE");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState<string | null>(null);

  const thisKey = value === null ? null : editing ? editing.id : "new";
  if (thisKey !== key) {
    setKey(thisKey);
    if (editing) {
      setNumber(String(editing.number));
      setSeats(String(editing.seats));
      setZone(editing.zone);
      setShape(editing.shape);
    } else if (value === "new") {
      setNumber(String(nextNumber));
      setSeats("4");
      setZone(existing[0]?.zone ?? "Үндсэн танхим");
      setShape("SQUARE");
    }
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = { number: Number(number), seats: Number(seats), zone: zone.trim() || "Үндсэн танхим", shape, posX: editing?.posX ?? 50, posY: editing?.posY ?? 50 };
      if (editing) await api(`/api/staff/tables/${editing.id}`, { method: "PUT", body });
      else await api("/api/staff/tables", { body });
      toast.success(editing ? "Ширээ шинэчлэгдлээ" : "Ширээ нэмэгдлээ");
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={value !== null} onClose={onClose} title={editing ? `Ширээ ${editing.number} засах` : "Ширээ нэмэх"} size="sm">
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ширээний дугаар"><Input inputMode="numeric" value={number} onChange={(e) => setNumber(e.target.value.replace(/\D/g, ""))} data-autofocus /></Field>
          <Field label="Суудлын тоо"><Input inputMode="numeric" value={seats} onChange={(e) => setSeats(e.target.value.replace(/\D/g, ""))} /></Field>
        </div>
        <Field label="Бүс"><Input value={zone} onChange={(e) => setZone(e.target.value)} list="zones" /><datalist id="zones">{[...new Set(existing.map((t) => t.zone))].map((z) => <option key={z} value={z} />)}</datalist></Field>
        <Field label="Хэлбэр">
          <Select value={shape} onChange={(e) => setShape(e.target.value as typeof shape)}>
            <option value="SQUARE">Дөрвөлжин</option>
            <option value="ROUND">Дугуй</option>
            <option value="RECT">Урт ширээ</option>
          </Select>
        </Field>
        {error ? <ErrorNotice message={error} /> : null}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>Болих</Button>
          <Button type="submit" loading={busy}>Хадгалах</Button>
        </div>
      </form>
    </Modal>
  );
}
