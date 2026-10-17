"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { formatMoneyShort } from "@/lib/format";
import { niceMax, useWidth } from "./use-size";

export type Bar = { label: string; value: number; tooltipTitle?: string; highlight?: boolean };

export function BarChart({
  data,
  height = 220,
  formatValue = formatMoneyShort,
  valueName = "Борлуулалт",
  ariaLabel,
  color = "#b4532a",
  mutedColor = "#d9cfbf",
  labelEvery = 1,
}: {
  data: Bar[];
  height?: number;
  formatValue?: (v: number) => string;
  valueName?: string;
  ariaLabel: string;
  color?: string;
  mutedColor?: string;
  labelEvery?: number;
}) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { top: 12, right: 8, bottom: 26, left: 44 };
  const w = Math.max(width, 260);
  const iw = w - pad.left - pad.right;
  const ih = height - pad.top - pad.bottom;
  const max = niceMax(Math.max(...data.map((d) => d.value), 1));
  const slot = iw / data.length;
  const bw = Math.max(4, Math.min(34, slot * 0.62));
  const ticks = [0, 0.5, 1].map((f) => f * max);
  const hd = hover !== null ? data[hover] : null;

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 ? (
        <svg width={w} height={height} role="img" aria-label={ariaLabel} onMouseLeave={() => setHover(null)}>
          {ticks.map((t) => {
            const yy = pad.top + ih - (t / max) * ih;
            return (
              <g key={t}>
                <line x1={pad.left} x2={w - pad.right} y1={yy} y2={yy} stroke="#e3dcd0" strokeDasharray={t === 0 ? undefined : "2 4"} />
                <text x={pad.left - 8} y={yy + 4} textAnchor="end" className="fill-stone-light text-[10.5px]">
                  {formatValue(t)}
                </text>
              </g>
            );
          })}
          {data.map((d, i) => {
            const bh = (d.value / max) * ih;
            const bx = pad.left + slot * i + (slot - bw) / 2;
            return (
              <g key={i} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} aria-label={`${d.tooltipTitle ?? d.label}: ${formatValue(d.value)}`}>
                <rect x={pad.left + slot * i} y={pad.top} width={slot} height={ih} fill="transparent" />
                <motion.rect
                  x={bx}
                  width={bw}
                  rx={Math.min(4, bw / 2)}
                  fill={hover === i || d.highlight ? color : mutedColor}
                  initial={{ y: reduce ? pad.top + ih - bh : pad.top + ih, height: reduce ? bh : 0 }}
                  animate={{ y: pad.top + ih - bh, height: bh }}
                  transition={{ duration: 0.55, delay: reduce ? 0 : i * 0.015, ease: [0.25, 1, 0.5, 1] }}
                />
                {i % labelEvery === 0 ? (
                  <text x={bx + bw / 2} y={height - 8} textAnchor="middle" className="fill-stone text-[10.5px]">
                    {d.label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      ) : null}
      {hd && hover !== null ? (
        <div
          className="pointer-events-none absolute z-10 rounded-md border border-line bg-surface px-3 py-2 text-xs shadow-raised"
          style={{ left: Math.min(Math.max(pad.left + slot * hover + slot / 2 - 60, 0), w - 130), top: -4 }}
          role="status"
        >
          <p className="font-medium">{hd.tooltipTitle ?? hd.label}</p>
          <p className="mt-0.5 text-stone">
            {valueName}: <span className="tabular font-semibold text-ink">{formatValue(hd.value)}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** Хэвтээ жагсаалтын дүн (шилдэг бүтээгдэхүүн, ангилал) */
export function HBars({ rows, formatValue }: { rows: Array<{ name: string; value: number; sub?: string }>; formatValue: (v: number) => string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  const reduce = useReducedMotion();
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.name}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium">
              <span className="tabular mr-2 text-xs text-stone-light">{i + 1}</span>
              {r.name}
            </span>
            <span className="tabular shrink-0 text-stone">
              {r.sub ? <span className="mr-2 text-xs">{r.sub}</span> : null}
              <span className="font-medium text-ink">{formatValue(r.value)}</span>
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-sand">
            <motion.div className="h-full rounded-full bg-ember" initial={{ width: reduce ? `${(r.value / max) * 100}%` : 0 }} animate={{ width: `${(r.value / max) * 100}%` }} transition={{ duration: 0.7, delay: i * 0.05, ease: [0.25, 1, 0.5, 1] }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
