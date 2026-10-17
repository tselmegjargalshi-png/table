"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { EmptyState } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { api } from "@/lib/client/fetcher";
import { useNow, usePoll } from "@/lib/client/use-poll";
import { formatElapsed, formatTime } from "@/lib/format";
import { ORDER_TYPE } from "@/lib/labels";
import type { OrderDTO } from "@/server/services/orders";

type ColumnKey = "new" | "preparing" | "ready";

const COLUMNS: Array<{ key: ColumnKey; title: string; statuses: OrderDTO["status"][]; action: { label: string; to: OrderDTO["status"] }; accent: string }> = [
  { key: "new", title: "ШИНЭ", statuses: ["NEW", "CONFIRMED"], action: { label: "Эхлүүлэх", to: "PREPARING" }, accent: "#d9893a" },
  { key: "preparing", title: "БЭЛТГЭЖ БАЙНА", statuses: ["PREPARING"], action: { label: "Бэлэн болгох", to: "READY" }, accent: "#5b9bd5" },
  { key: "ready", title: "БЭЛЭН", statuses: ["READY"], action: { label: "Өгсөн", to: "DELIVERED" }, accent: "#5fae82" },
];

function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [880, 1175].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      o.type = "sine";
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.16);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + i * 0.16 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.16 + 0.22);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.16);
      o.stop(ctx.currentTime + i * 0.16 + 0.25);
    });
    window.setTimeout(() => void ctx.close(), 800);
  } catch {
    /* дуу гаргах боломжгүй төхөөрөмж */
  }
}

export function KitchenClient({ initial, restaurantName, canGoBack }: { initial: OrderDTO[]; restaurantName: string; canGoBack: boolean }) {
  const { data, setData, error, refresh } = usePoll<OrderDTO[]>("/api/staff/kitchen", initial, 4000);
  const now = useNow(1000);
  const toast = useToast();
  const [sound, setSound] = useState(false);
  const [tab, setTab] = useState<ColumnKey>("new");
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const seen = useRef(new Set(initial.map((o) => o.id)));

  useEffect(() => {
    const fresh = data.filter((o) => !seen.current.has(o.id) && o.status === "NEW");
    for (const o of data) seen.current.add(o.id);
    if (fresh.length && sound) beep();
  }, [data, sound]);

  const grouped = useMemo(
    () =>
      Object.fromEntries(
        COLUMNS.map((c) => [
          c.key,
          data.filter((o) => c.statuses.includes(o.status)).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
        ]),
      ) as Record<ColumnKey, OrderDTO[]>,
    [data],
  );

  async function advance(o: OrderDTO, to: OrderDTO["status"]) {
    setBusy((b) => new Set(b).add(o.id));
    const prev = data;
    setData((list) => (to === "DELIVERED" ? list.filter((x) => x.id !== o.id) : list.map((x) => (x.id === o.id ? { ...x, status: to, startedAt: to === "PREPARING" ? new Date().toISOString() : x.startedAt } : x))));
    try {
      await api(`/api/staff/orders/${o.id}`, { method: "PATCH", body: { status: to } });
      void refresh();
    } catch (e) {
      setData(prev);
      toast.error((e as Error).message);
    } finally {
      setBusy((b) => {
        const n = new Set(b);
        n.delete(o.id);
        return n;
      });
    }
  }

  const clock = formatTime(now);

  return (
    <div className="flex h-dvh flex-col bg-kds-bg text-kds-text">
      <header className="flex items-center gap-4 border-b border-kds-line bg-kds-panel px-4 py-3 sm:px-6">
        <Logo tone="light" size={26} />
        <span className="hidden text-sm text-kds-muted sm:inline">Гал тогоо · {restaurantName}</span>
        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          {error ? <span className="flex items-center gap-1.5 text-xs text-[#e07a6c]"><Icon name="alert" size={14} />Холболт тасарлаа</span> : null}
          <button
            onClick={() => {
              setSound((s) => !s);
              if (!sound) beep();
            }}
            aria-pressed={sound}
            className={cn("flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors", sound ? "border-[#5fae82]/50 bg-[#5fae82]/15 text-[#8fd0ac]" : "border-kds-line text-kds-muted hover:text-kds-text")}
          >
            <Icon name="bell" size={16} />
            <span className="hidden sm:inline">{sound ? "Дуу идэвхтэй" : "Дуу унтраалттай"}</span>
          </button>
          <button
            onClick={() => (document.fullscreenElement ? void document.exitFullscreen() : void document.documentElement.requestFullscreen?.())}
            aria-label="Дэлгэц томруулах"
            className="hidden h-10 w-10 items-center justify-center rounded-md border border-kds-line text-kds-muted transition-colors hover:text-kds-text sm:flex"
          >
            <Icon name="eye" size={16} />
          </button>
          {canGoBack ? (
            <Link href="/app" className="flex h-10 items-center gap-2 rounded-md border border-kds-line px-3 text-sm font-medium text-kds-muted transition-colors hover:text-kds-text">
              <Icon name="arrowLeft" size={15} />
              <span className="hidden sm:inline">Самбар</span>
            </Link>
          ) : null}
          <span className="tabular font-mono text-xl font-medium tracking-tight sm:text-2xl" aria-label="Одоогийн цаг">{clock}</span>
        </div>
      </header>

      <div className="flex gap-1 border-b border-kds-line bg-kds-panel p-2 md:hidden" role="tablist" aria-label="Баганууд">
        {COLUMNS.map((c) => (
          <button
            key={c.key}
            role="tab"
            aria-selected={tab === c.key}
            onClick={() => setTab(c.key)}
            className={cn("flex-1 rounded-md py-2.5 text-xs font-bold tracking-wider", tab === c.key ? "bg-kds-card text-kds-text" : "text-kds-muted")}
          >
            {c.title} <span className="tabular ml-1 opacity-70">{grouped[c.key].length}</span>
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 md:grid-cols-3">
        {COLUMNS.map((c) => (
          <section key={c.key} aria-label={c.title} className={cn("flex min-h-0 flex-col border-kds-line md:border-r last:md:border-r-0", tab === c.key ? "flex" : "hidden md:flex")}>
            <div className="hidden items-center justify-between border-b border-kds-line px-5 py-3 md:flex">
              <h2 className="flex items-center gap-2.5 text-[13px] font-bold tracking-[0.14em]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.accent }} />
                {c.title}
              </h2>
              <span className="tabular rounded-md bg-kds-card px-2.5 py-0.5 text-sm font-semibold">{grouped[c.key].length}</span>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 sm:p-4">
              <AnimatePresence initial={false} mode="popLayout">
                {grouped[c.key].map((o) => (
                  <KdsCard key={o.id} order={o} column={c} now={now} busy={busy.has(o.id)} onAdvance={() => void advance(o, c.action.to)} />
                ))}
              </AnimatePresence>
              {grouped[c.key].length === 0 ? <EmptyState tone="dark" icon={c.key === "new" ? "receipt" : c.key === "preparing" ? "flame" : "check"} title={c.key === "new" ? "Шинэ захиалга алга" : c.key === "preparing" ? "Бэлтгэж буй захиалга алга" : "Бэлэн захиалга алга"} className="py-16" /> : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function KdsCard({ order, column, now, busy, onAdvance }: { order: OrderDTO; column: (typeof COLUMNS)[number]; now: number; busy: boolean; onAdvance: () => void }) {
  const created = new Date(order.createdAt).getTime();
  const elapsed = now - (column.key === "ready" ? new Date(order.readyAt ?? order.createdAt).getTime() : created);
  const minutes = elapsed / 60000;
  const urgency = column.key === "ready" ? (minutes > 8 ? "warn" : "ok") : minutes >= 15 ? "late" : minutes >= 10 ? "warn" : "ok";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, x: 24 }}
      transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
      className={cn("overflow-hidden rounded-xl border-2 bg-kds-card", urgency === "late" ? "border-[#c4503f]" : urgency === "warn" ? "border-[#c58a2b]/70" : "border-kds-line")}
      aria-label={`Захиалга ${order.number}`}
    >
      <div className={cn("flex items-center justify-between px-4 py-3", urgency === "late" ? "bg-[#c4503f]/18" : urgency === "warn" ? "bg-[#c58a2b]/14" : "bg-white/[0.03]")}>
        <div>
          <p className="tabular text-[28px] font-bold leading-none tracking-tight">#{order.number}</p>
          <p className="mt-1.5 flex items-center gap-2 text-[17px] font-semibold">
            {order.table ? `Ширээ ${order.table}` : ORDER_TYPE[order.type].label}
            {order.table ? null : order.customerName ? <span className="text-sm font-normal text-kds-muted">{order.customerName}</span> : null}
          </p>
        </div>
        <div className="text-right">
          <p className={cn("tabular font-mono text-[26px] font-semibold leading-none", urgency === "late" ? "animate-pulse-soft text-[#f08a78]" : urgency === "warn" ? "text-[#f0b45a]" : "text-kds-text")}>{formatElapsed(elapsed)}</p>
          <p className="mt-1.5 text-xs text-kds-muted">{formatTime(order.createdAt)}</p>
        </div>
      </div>
      <ul className="space-y-2 px-4 py-3.5">
        {order.items.map((i) => (
          <li key={i.id} className="flex gap-3 text-[20px] leading-tight">
            <span className="tabular w-9 shrink-0 font-bold text-[#f0b45a]">{i.quantity}×</span>
            <div className="min-w-0">
              <p className="font-semibold">{i.name}</p>
              {i.options.length > 0 ? <p className="mt-0.5 text-[15px] font-normal text-kds-muted">{i.options.map((o) => o.name).join(", ")}</p> : null}
              {i.removed.length > 0 ? <p className="mt-0.5 text-[15px] font-medium text-[#f08a78]">Хасах: {i.removed.join(", ")}</p> : null}
              {i.note ? <p className="mt-0.5 text-[15px] italic text-[#f0b45a]">«{i.note}»</p> : null}
            </div>
          </li>
        ))}
      </ul>
      {order.note ? (
        <p className="mx-4 mb-3 flex gap-2 rounded-md border border-[#c58a2b]/40 bg-[#c58a2b]/10 px-3 py-2 text-[15px] text-[#f0c27a]">
          <Icon name="info" size={17} className="mt-0.5 shrink-0" />
          {order.note}
        </p>
      ) : null}
      <button
        onClick={onAdvance}
        disabled={busy}
        className="flex h-16 w-full items-center justify-center text-[18px] font-bold tracking-wide text-[#11100f] transition-[filter,transform] hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
        style={{ backgroundColor: column.accent }}
      >
        {column.action.label}
      </button>
    </motion.article>
  );
}
