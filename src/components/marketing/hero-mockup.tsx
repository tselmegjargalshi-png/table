"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";

type Status = "NEW" | "PREPARING" | "READY";
type Ticket = { id: number; table: string; items: string[]; total: number; status: Status; ageSec: number };

const TEMPLATES: Omit<Ticket, "id" | "status" | "ageSec">[] = [
  { table: "Ширээ 4", items: ["Бууз ×10", "Сүүтэй цай ×2"], total: 24_000 },
  { table: "Ширээ 7", items: ["Хуушуур ×4", "Айраг ×1"], total: 19_500 },
  { table: "Аваад явах", items: ["Цуйван ×2", "Хоолны салат ×1"], total: 32_000 },
  { table: "Ширээ 2", items: ["Банштай шөл ×2", "Бууз ×6"], total: 27_600 },
  { table: "Хүргэлт", items: ["Хуушуур ×8", "Ногоон цай ×2"], total: 41_000 },
  { table: "Ширээ 11", items: ["Тэвштэй хонины мах", "Бууз ×4"], total: 48_500 },
  { table: "Ширээ 5", items: ["Цуйван ×1", "Чихэрлэг цай ×1"], total: 16_800 },
  { table: "Ширээ 9", items: ["Бууз ×12", "Айраг ×2"], total: 36_400 },
];

const SEED: Ticket[] = [
  { ...TEMPLATES[0], id: 1, status: "PREPARING", ageSec: 412 },
  { ...TEMPLATES[1], id: 2, status: "NEW", ageSec: 96 },
  { ...TEMPLATES[2], id: 3, status: "READY", ageSec: 604 },
];

const TABS = [
  { id: "dash", label: "Самбар" },
  { id: "orders", label: "Захиалга" },
  { id: "kds", label: "Гал тогоо" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const STATUS_LABEL: Record<Status, string> = { NEW: "Шинэ", PREPARING: "Бэлтгэж байна", READY: "Бэлэн" };
const NEXT: Record<Status, Status | null> = { NEW: "PREPARING", PREPARING: "READY", READY: null };
const NEXT_LABEL: Record<Status, string> = { NEW: "Хүлээн авах", PREPARING: "Бэлэн болгох", READY: "" };

function mmss(sec: number) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

export function HeroMockup() {
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<Tab>("dash");
  const [tickets, setTickets] = useState<Ticket[]>(SEED);
  const [toast, setToast] = useState<Ticket | null>(null);
  const [added, setAdded] = useState(0);
  const nextId = useRef(4);
  const cursor = useRef(3);

  // Хугацаа ба шинэ захиалгын симуляци
  useEffect(() => {
    const tick = setInterval(() => setTickets((ts) => ts.map((t) => (t.status === "READY" ? t : { ...t, ageSec: t.ageSec + 1 }))), 1000);
    const add = setInterval(() => {
      const base = TEMPLATES[cursor.current++ % TEMPLATES.length];
      const t: Ticket = { ...base, id: nextId.current++, status: "NEW", ageSec: 0 };
      setTickets((ts) => [t, ...ts.filter((x) => x.status !== "READY" || ts.indexOf(x) < 4)].slice(0, 7));
      setToast(t);
      setAdded((n) => n + 1);
    }, 7000);
    return () => {
      clearInterval(tick);
      clearInterval(add);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  const advance = useCallback((id: number) => {
    setTickets((ts) => ts.map((t) => (t.id === id && NEXT[t.status] ? { ...t, status: NEXT[t.status]! } : t)));
  }, []);

  const revenue = 1_284_500 + tickets.reduce((s, t) => s + t.total, 0) - SEED.reduce((s, t) => s + t.total, 0);
  const orderCount = 86 + added;

  // 3D хазайлт (зөвхөн хулгана ашиглах төхөөрөмж дээр)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 90, damping: 18 });
  const sy = useSpring(my, { stiffness: 90, damping: 18 });
  const rotY = useTransform(sx, [-1, 1], [-9, -1]);
  const rotX = useTransform(sy, [-1, 1], [7, 1]);

  return (
    <div
      className="relative [perspective:1600px]"
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
        my.set(((e.clientY - r.top) / r.height) * 2 - 1);
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      <motion.div
        className="relative lg:[transform-style:preserve-3d]"
        style={reduce ? undefined : { rotateY: rotY, rotateX: rotX }}
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
      >
        <div className="overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-float" role="group" aria-label="TABLE.MN хянах самбарын жишээ">
          {/* Цонхны толгой */}
          <div className="flex items-center gap-3 border-b border-line bg-sand/70 px-4 py-2.5">
            <span className="flex gap-1.5" aria-hidden="true">
              <i className="h-2.5 w-2.5 rounded-full bg-line-strong" />
              <i className="h-2.5 w-2.5 rounded-full bg-line-strong" />
              <i className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            </span>
            <span className="mx-auto truncate rounded-md bg-surface px-3 py-1 font-mono text-[11px] text-stone">hotyn-buuz.table.mn/app</span>
            <span className="w-10" aria-hidden="true" />
          </div>

          <div className="grid min-h-[400px] grid-cols-[3.25rem_1fr] sm:grid-cols-[10rem_1fr]">
            <aside className="border-r border-line bg-paper/60 p-2 sm:p-3">
              <p className="mb-3 hidden items-center gap-2 px-1 text-[13px] font-semibold sm:flex">
                <span className="grid h-6 w-6 place-items-center rounded-md bg-ember text-[10px] text-white">ХБ</span>
                Хотын бууз
              </p>
              <nav className="flex flex-col gap-1" role="tablist" aria-label="Хэсэг сонгох">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={tab === t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] transition-colors",
                      tab === t.id ? "bg-ink text-paper" : "text-stone hover:bg-sand hover:text-ink",
                    )}
                    title={t.label}
                  >
                    <Icon name={t.id === "dash" ? "dashboard" : t.id === "orders" ? "receipt" : "flame"} size={16} />
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                ))}
                {["Ширээ", "Меню", "Тайлан"].map((l, i) => (
                  <span key={l} className="hidden items-center gap-2 px-2 py-2 text-[13px] text-stone-light sm:flex" aria-hidden="true">
                    <Icon name={(["table", "book", "chart"] as const)[i]} size={16} />
                    {l}
                  </span>
                ))}
              </nav>
            </aside>

            <div className="min-w-0 p-3 sm:p-5" role="tabpanel">
              {tab === "dash" && <DashPanel revenue={revenue} orders={orderCount} />}
              {tab === "orders" && <OrdersPanel tickets={tickets} onAdvance={advance} />}
              {tab === "kds" && <KdsPanel tickets={tickets} onAdvance={advance} />}
            </div>
          </div>
        </div>

        {/* Урд талд хөвөх шинэ захиалгын мэдэгдэл */}
        <motion.div
          aria-live="polite"
          className="pointer-events-none absolute -bottom-5 -left-3 hidden w-60 sm:block lg:[transform:translateZ(60px)]"
          animate={{ opacity: toast ? 1 : 0, y: toast ? 0 : 10 }}
          transition={{ duration: 0.3 }}
        >
          {toast ? (
            <div className="rounded-xl border border-line-strong bg-surface p-3 shadow-raised">
              <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-ember">
                <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-ember" /> Шинэ захиалга
              </p>
              <p className="mt-1 text-sm font-medium">{toast.table}</p>
              <p className="text-xs text-stone">{toast.items.join(", ")}</p>
            </div>
          ) : null}
        </motion.div>
      </motion.div>
      <p className="mt-6 text-center text-xs text-stone-light">Жишээ өгөгдөл. Табыг сонгож, захиалгын төлөвийг өөрчилж үзээрэй.</p>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-line bg-paper/50 p-3">
      <p className="text-[11px] text-stone">{label}</p>
      <p className="mt-1 whitespace-nowrap font-mono text-[15px] font-medium tabular sm:text-lg">{value}</p>
      <p className="mt-0.5 text-[11px] text-success">{sub}</p>
    </div>
  );
}

const SERIES = [32, 41, 38, 52, 61, 58, 72, 84, 79, 96, 88, 104];

function DashPanel({ revenue, orders }: { revenue: number; orders: number }) {
  const w = 520;
  const h = 150;
  const max = 120;
  const pts = SERIES.map((v, i) => [(i / (SERIES.length - 1)) * w, h - (v / max) * h] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <div className="animate-fade-in">
      <div className="flex items-baseline justify-between">
        <h3 className="font-serif text-lg">Өнөөдөр</h3>
        <span className="flex items-center gap-1.5 text-[11px] text-success">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-success" /> Шууд
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
        <Kpi label="Борлуулалт" value={formatMoney(revenue)} sub="+12% өчигдрөөс" />
        <Kpi label="Захиалга" value={String(orders)} sub="+9 өчигдрөөс" />
        <Kpi label="Дундаж чек" value={formatMoney(14_940)} sub="+3%" />
        <Kpi label="Ширээ" value="12 / 18" sub="67% дүүрэлт" />
      </div>
      <div className="mt-3 rounded-lg border border-line p-3">
        <p className="text-[11px] text-stone">Цагаар борлуулалт</p>
        <svg viewBox={`0 0 ${w} ${h + 18}`} className="mt-2 w-full" role="img" aria-label="Цагаар борлуулалтын график">
          <defs>
            <linearGradient id="hm-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#b4532a" stopOpacity="0.22" />
              <stop offset="1" stopColor="#b4532a" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1="0" x2={w} y1={h * g} y2={h * g} stroke="#e3dcd0" strokeDasharray="3 4" />
          ))}
          <path d={`${line} L${w},${h} L0,${h} Z`} fill="url(#hm-area)" />
          <path d={line} fill="none" stroke="#b4532a" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {["10", "12", "14", "16", "18", "20"].map((t, i) => (
            <text key={t} x={(i / 5) * w} y={h + 14} fontSize="10" fill="#9a9388" fontFamily="var(--font-jetbrains)" textAnchor={i === 0 ? "start" : i === 5 ? "end" : "middle"}>
              {t}:00
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

function OrdersPanel({ tickets, onAdvance }: { tickets: Ticket[]; onAdvance: (id: number) => void }) {
  return (
    <div className="animate-fade-in">
      <h3 className="font-serif text-lg">Захиалга</h3>
      <ul className="mt-3 space-y-2">
        {tickets.slice(0, 5).map((t) => (
          <li key={t.id} className="flex items-center gap-3 rounded-lg border border-line p-2.5 sm:p-3">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-medium">
                {t.table}
                <span className="font-mono text-[11px] font-normal text-stone-light">#{100 + t.id}</span>
              </p>
              <p className="truncate text-xs text-stone">{t.items.join(", ")}</p>
            </div>
            <span className="hidden font-mono text-xs tabular sm:block">{formatMoney(t.total)}</span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                t.status === "NEW" && "bg-info-soft text-info",
                t.status === "PREPARING" && "bg-warning-soft text-warning",
                t.status === "READY" && "bg-success-soft text-success",
              )}
            >
              {STATUS_LABEL[t.status]}
            </span>
            {NEXT[t.status] ? (
              <button onClick={() => onAdvance(t.id)} className="hidden shrink-0 rounded-md border border-line-strong px-2 py-1 text-[11px] font-medium hover:bg-sand md:block">
                {NEXT_LABEL[t.status]}
              </button>
            ) : (
              <span className="hidden w-[82px] md:block" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function KdsPanel({ tickets, onAdvance }: { tickets: Ticket[]; onAdvance: (id: number) => void }) {
  const cols: { s: Status; label: string }[] = [
    { s: "NEW", label: "ШИНЭ" },
    { s: "PREPARING", label: "БЭЛТГЭЖ БАЙНА" },
    { s: "READY", label: "БЭЛЭН" },
  ];
  return (
    <div className="animate-fade-in -m-3 rounded-lg bg-kds-bg p-3 text-kds-text sm:-m-5 sm:p-4">
      <div className="grid grid-cols-3 gap-2">
        {cols.map((c) => {
          const list = tickets.filter((t) => t.status === c.s).slice(0, 3);
          return (
            <div key={c.s} className="min-w-0">
              <p className="mb-2 flex items-center justify-between font-mono text-[10px] tracking-wider text-kds-muted">
                <span className="truncate">{c.label}</span>
                <span>{tickets.filter((t) => t.status === c.s).length}</span>
              </p>
              <div className="space-y-2">
                {list.map((t) => {
                  const urgent = t.status !== "READY" && t.ageSec > 600;
                  const warn = t.status !== "READY" && t.ageSec > 300;
                  return (
                    <button
                      key={t.id}
                      onClick={() => onAdvance(t.id)}
                      disabled={!NEXT[t.status]}
                      className={cn(
                        "block w-full rounded-md border bg-kds-card p-2 text-left transition-colors enabled:hover:bg-kds-line/60",
                        urgent ? "border-danger" : warn ? "border-warning" : "border-kds-line",
                      )}
                      aria-label={`${t.table}, ${STATUS_LABEL[t.status]}${NEXT[t.status] ? `. ${NEXT_LABEL[t.status]}` : ""}`}
                    >
                      <span className="flex items-center justify-between gap-1 text-[11px] font-semibold">
                        <span className="truncate">{t.table}</span>
                        <span className={cn("font-mono tabular", urgent ? "text-[#e8776c]" : warn ? "text-[#e0b04f]" : "text-kds-muted")}>{mmss(t.ageSec)}</span>
                      </span>
                      <span className="mt-1 block text-[11px] leading-snug text-kds-muted">
                        {t.items.map((it) => (
                          <span key={it} className="block truncate">
                            {it}
                          </span>
                        ))}
                      </span>
                    </button>
                  );
                })}
                {list.length === 0 ? <p className="rounded-md border border-dashed border-kds-line p-3 text-center text-[11px] text-kds-muted">Хоосон</p> : null}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-kds-muted">Захиалга дээр дарж дараагийн шатанд шилжүүлнэ.</p>
    </div>
  );
}
