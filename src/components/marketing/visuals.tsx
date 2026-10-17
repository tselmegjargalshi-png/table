import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";

/** Онцлог тус бүрийн жижиг, статик жишээ дүрслэл. Бүгд HTML/CSS/SVG, зураг ашиглаагүй. */

function Frame({ children, className, dark }: { children: React.ReactNode; className?: string; dark?: boolean }) {
  return (
    <div aria-hidden="true" className={cn("overflow-hidden rounded-2xl border p-4 shadow-raised sm:p-5", dark ? "border-kds-line bg-kds-bg text-kds-text" : "border-line-strong bg-surface", className)}>
      {children}
    </div>
  );
}

export function DashboardVisual() {
  const bars = [38, 52, 44, 61, 70, 66, 82];
  return (
    <Frame>
      <div className="grid grid-cols-3 gap-2">
        {[
          ["Борлуулалт", "1,284,500₮"],
          ["Захиалга", "86"],
          ["Дундаж чек", "14,940₮"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-line bg-paper/60 p-3">
            <p className="text-[11px] text-stone">{k}</p>
            <p className="mt-1 font-mono text-sm tabular sm:text-base">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex h-28 items-end gap-2 rounded-lg border border-line p-3">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 rounded-t-sm bg-ember/80" style={{ height: `${h}%`, opacity: 0.45 + i * 0.08 }} />
        ))}
      </div>
      <div className="mt-3 space-y-1.5">
        {[
          ["Ширээ 4", "Бэлтгэж байна", "bg-warning-soft text-warning"],
          ["Хүргэлт", "Шинэ", "bg-info-soft text-info"],
        ].map(([t, s, c]) => (
          <div key={t} className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-xs">
            <span className="font-medium">{t}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", c)}>{s}</span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

export function QrMenuVisual() {
  return (
    <Frame className="flex items-center justify-center gap-4 bg-sand/60 py-8">
      <div className="w-[13.5rem] rounded-[1.75rem] border-[6px] border-ink bg-paper p-3 shadow-float">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong" />
        <p className="font-serif text-base">Хотын бууз</p>
        <p className="text-[10px] text-stone">Ширээ 4</p>
        <div className="mt-2 flex gap-1.5 overflow-hidden text-[10px]">
          {["Бүгд", "Бууз", "Шөл", "Ундаа"].map((c, i) => (
            <span key={c} className={cn("shrink-0 rounded-full px-2 py-1", i === 1 ? "bg-ink text-paper" : "bg-sand text-stone")}>
              {c}
            </span>
          ))}
        </div>
        <div className="mt-3 space-y-2">
          {[
            ["Үхрийн бууз", "18,000₮"],
            ["Хонины бууз", "19,500₮"],
            ["Цөцгийтэй бууз", "21,000₮"],
          ].map(([n, p]) => (
            <div key={n} className="flex items-center gap-2 rounded-lg border border-line bg-surface p-2">
              <span className="h-9 w-9 shrink-0 rounded-md bg-ember-soft" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-medium">{n}</span>
                <span className="font-mono text-[10px] text-stone">{p}</span>
              </span>
              <span className="grid h-5 w-5 place-items-center rounded-full bg-ink text-paper">
                <Icon name="plus" size={11} />
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="hidden w-28 shrink-0 rounded-xl border border-line bg-surface p-3 text-center sm:block">
        <svg viewBox="0 0 21 21" className="w-full" shapeRendering="crispEdges">
          {QR_CELLS.map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#161513" />
          ))}
        </svg>
        <p className="mt-2 text-[10px] text-stone">Ширээ 4</p>
      </div>
    </Frame>
  );
}

// Дүрслэлд зориулсан тогтмол QR маягийн хэв
const QR_CELLS: [number, number][] = (() => {
  const cells: [number, number][] = [];
  const finder = (ox: number, oy: number) => {
    for (let i = 0; i < 7; i++)
      for (let j = 0; j < 7; j++) {
        const edge = i === 0 || j === 0 || i === 6 || j === 6;
        const core = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        if (edge || core) cells.push([ox + i, oy + j]);
      }
  };
  finder(0, 0);
  finder(14, 0);
  finder(0, 14);
  let seed = 7;
  for (let y = 0; y < 21; y++)
    for (let x = 0; x < 21; x++) {
      const inFinder = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
      if (inFinder) continue;
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      if (seed % 100 < 46) cells.push([x, y]);
    }
  return cells;
})();

export function OrderingVisual() {
  const steps = ["Хүлээн авсан", "Бэлтгэж байна", "Бэлэн", "Хүлээлгэн өгсөн"];
  return (
    <Frame>
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-sand p-1 text-center text-[11px]">
        {["Ширээн дээрээс", "Аваад явах", "Хүргэлт"].map((t, i) => (
          <span key={t} className={cn("rounded-md px-1 py-1.5", i === 0 ? "bg-surface font-medium shadow-soft" : "text-stone")}>
            {t}
          </span>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-line p-4">
        <p className="text-xs text-stone">Захиалга #142</p>
        <p className="mt-0.5 font-serif text-lg">Таны хоол бэлтгэгдэж байна</p>
        <ol className="mt-4 space-y-3">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-3 text-sm">
              <span className={cn("grid h-5 w-5 place-items-center rounded-full border text-[10px]", i < 1 ? "border-success bg-success text-white" : i === 1 ? "border-ember text-ember" : "border-line-strong text-stone-light")}>
                {i < 1 ? <Icon name="check" size={11} /> : i === 1 ? <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-ember" /> : null}
              </span>
              <span className={i > 1 ? "text-stone-light" : i === 1 ? "font-medium" : "text-stone"}>{s}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="mt-3 flex items-center justify-between rounded-lg bg-paper px-3 py-2.5 text-sm">
        <span className="text-stone">Нийт</span>
        <span className="font-mono">42,500₮</span>
      </div>
    </Frame>
  );
}

export function KdsVisual() {
  const col = (title: string, tickets: [string, string, string, string][]) => (
    <div className="min-w-0">
      <p className="mb-2 font-mono text-[10px] tracking-wider text-kds-muted">{title}</p>
      <div className="space-y-2">
        {tickets.map(([t, time, item, border]) => (
          <div key={t} className={cn("rounded-md border bg-kds-card p-2.5", border)}>
            <div className="flex justify-between text-xs font-semibold">
              <span>{t}</span>
              <span className="font-mono text-kds-muted">{time}</span>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-kds-muted">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <Frame dark>
      <div className="grid grid-cols-3 gap-2.5">
        {col("ШИНЭ", [["Ширээ 7", "01:12", "Хуушуур ×4", "border-kds-line"], ["Хүргэлт", "00:34", "Цуйван ×2", "border-kds-line"]])}
        {col("БЭЛТГЭЖ БАЙНА", [["Ширээ 4", "07:40", "Бууз ×10, Цай ×2", "border-warning"], ["Ширээ 2", "13:05", "Банштай шөл ×2", "border-danger"]])}
        {col("БЭЛЭН", [["Аваад явах", "04:20", "Бууз ×6", "border-success"]])}
      </div>
    </Frame>
  );
}

export function FloorVisual() {
  const tables: { x: number; y: number; n: number; s: "free" | "busy" | "bill" | "clean"; w?: number }[] = [
    { x: 8, y: 12, n: 1, s: "free" },
    { x: 34, y: 8, n: 2, s: "busy" },
    { x: 62, y: 12, n: 3, s: "bill" },
    { x: 10, y: 50, n: 4, s: "busy", w: 22 },
    { x: 42, y: 52, n: 5, s: "free" },
    { x: 70, y: 50, n: 6, s: "clean" },
    { x: 24, y: 82, n: 7, s: "free" },
    { x: 56, y: 82, n: 8, s: "busy" },
  ];
  const tone = { free: "bg-success-soft border-success/40 text-success", busy: "bg-warning-soft border-warning/40 text-warning", bill: "bg-info-soft border-info/40 text-info", clean: "bg-sand border-line-strong text-stone" };
  const side = { free: "bg-success/35", busy: "bg-warning/35", bill: "bg-info/35", clean: "bg-line-strong" };
  return (
    <Frame className="!p-0">
      <div className="relative bg-sand/50 py-6 [perspective:900px]">
        <div className="relative mx-auto h-60 w-[92%] origin-center rounded-xl border border-line-strong bg-surface hairline-grid sm:h-64" style={{ transform: "rotateX(24deg)" }}>
          {tables.map((t) => (
            <div key={t.n} className="absolute" style={{ left: `${t.x}%`, top: `${t.y - 4}%`, width: `${t.w ?? 17}%` }}>
              <div className={cn("grid h-9 place-items-center rounded-md border font-mono text-xs font-medium sm:h-10", tone[t.s])}>{t.n}</div>
              <div className={cn("mx-[3px] h-1.5 rounded-b-md", side[t.s])} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line px-4 py-3 text-[11px] text-stone">
        {[
          ["Сул", "bg-success"],
          ["Захиалгатай", "bg-warning"],
          ["Төлбөр хүлээж байна", "bg-info"],
          ["Цэвэрлэнэ", "bg-line-strong"],
        ].map(([l, c]) => (
          <span key={l} className="inline-flex items-center gap-1.5">
            <i className={cn("h-2 w-2 rounded-full", c)} />
            {l}
          </span>
        ))}
      </div>
    </Frame>
  );
}

export function ReservationsVisual() {
  const rows = [
    ["18:00", "Болормаа", "4 хүн", "Ширээ 5", "bg-success-soft text-success", "Баталгаажсан"],
    ["18:30", "Тэмүүлэн", "2 хүн", "Ширээ 2", "bg-warning-soft text-warning", "Хүлээгдэж байна"],
    ["19:00", "Оюунчимэг", "8 хүн", "Ширээ 9", "bg-success-soft text-success", "Баталгаажсан"],
    ["20:15", "Ганзориг", "3 хүн", "Ширээ 3", "bg-info-soft text-info", "Ирсэн"],
  ];
  return (
    <Frame>
      <div className="flex items-baseline justify-between">
        <p className="font-serif text-lg">Өнөөдөр</p>
        <p className="text-xs text-stone">4 урьдчилсан захиалга</p>
      </div>
      <div className="mt-3 divide-y divide-line rounded-lg border border-line">
        {rows.map(([time, name, size, table, tone, label]) => (
          <div key={time} className="flex items-center gap-3 px-3 py-2.5">
            <span className="w-11 font-mono text-sm">{time}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{name}</span>
              <span className="text-xs text-stone">
                {size} · {table}
              </span>
            </span>
            <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", tone)}>{label}</span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

export function CrmVisual() {
  const rows = [
    ["Болормаа Б.", "24 удаа", "612,400₮", "Тогтмол"],
    ["Тэмүүлэн Г.", "11 удаа", "238,000₮", "Тогтмол"],
    ["Оюунчимэг Д.", "3 удаа", "74,500₮", ""],
  ];
  return (
    <Frame>
      <div className="space-y-2">
        {rows.map(([n, v, s, tag]) => (
          <div key={n} className="flex items-center gap-3 rounded-lg border border-line p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ember-soft font-serif text-sm text-ember-dark">{n[0]}</span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-sm font-medium">
                {n}
                {tag ? <span className="rounded-full bg-ember-soft px-1.5 py-0.5 text-[10px] font-medium text-ember-dark">{tag}</span> : null}
              </span>
              <span className="text-xs text-stone">{v}</span>
            </span>
            <span className="font-mono text-xs tabular">{s}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg bg-paper p-3 text-xs">
        <p className="font-medium">Дуртай хоол</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {["Үхрийн бууз", "Сүүтэй цай", "Хуушуур"].map((f) => (
            <span key={f} className="rounded-full border border-line bg-surface px-2 py-1 text-stone">
              {f}
            </span>
          ))}
        </div>
        <p className="mt-3 rounded-md border border-dashed border-line-strong p-2 text-stone">Тэмдэглэл: цонхны дэргэд суух дуртай</p>
      </div>
    </Frame>
  );
}

export function AnalyticsVisual() {
  const pts = [22, 30, 26, 38, 35, 48, 44, 58, 52, 66, 61, 78];
  const w = 320;
  const h = 110;
  const line = pts.map((v, i) => `${i ? "L" : "M"}${(i / (pts.length - 1)) * w},${h - (v / 80) * h}`).join(" ");
  const top = [
    ["Үхрийн бууз", 92],
    ["Хуушуур", 71],
    ["Цуйван", 54],
    ["Сүүтэй цай", 38],
  ] as const;
  return (
    <Frame>
      <div className="flex items-center justify-between">
        <p className="text-xs text-stone">Сүүлийн 30 хоног</p>
        <span className="rounded bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success">+14% өмнөх үеэс</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 w-full">
        <path d={`${line} L${w},${h} L0,${h} Z`} fill="#b4532a" opacity="0.12" />
        <path d={line} fill="none" stroke="#b4532a" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="mt-4 space-y-2.5">
        {top.map(([n, v]) => (
          <div key={n} className="text-xs">
            <div className="mb-1 flex justify-between">
              <span>{n}</span>
              <span className="font-mono text-stone">{v}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-sand">
              <div className="h-full rounded-full bg-ink" style={{ width: `${v}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}
