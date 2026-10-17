"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId, useMemo, useState } from "react";
import { formatMoneyShort } from "@/lib/format";
import { niceMax, useWidth } from "./use-size";

export type Point = { label: string; value: number; secondary?: number; tooltipTitle?: string };

type Props = {
  data: Point[];
  height?: number;
  formatValue?: (v: number) => string;
  formatAxis?: (v: number) => string;
  primaryName?: string;
  secondaryName?: string;
  labelEvery?: number;
  ariaLabel: string;
  color?: string;
};

export function AreaChart({ data, height = 260, formatValue = formatMoneyShort, formatAxis = formatMoneyShort, primaryName = "Борлуулалт", secondaryName, labelEvery, ariaLabel, color = "#b4532a" }: Props) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const id = useId();
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { top: 14, right: 12, bottom: 28, left: 52 };
  const w = Math.max(width, 280);
  const iw = w - pad.left - pad.right;
  const ih = height - pad.top - pad.bottom;

  const max = useMemo(() => niceMax(Math.max(...data.map((d) => Math.max(d.value, d.secondary ?? 0)), 1)), [data]);
  const x = (i: number) => pad.left + (data.length <= 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v: number) => pad.top + ih - (v / max) * ih;

  const path = (key: "value" | "secondary") => {
    const pts = data.map((d, i) => [x(i), y((key === "value" ? d.value : d.secondary) ?? 0)] as const);
    if (pts.length === 0) return "";
    // Зөөлөн муруй (monotone-ish Catmull-Rom → Bézier)
    let dpath = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] ?? p2;
      const t = 0.18;
      const c1 = [p1[0] + (p2[0] - p0[0]) * t, Math.min(Math.max(p1[1] + (p2[1] - p0[1]) * t, pad.top), pad.top + ih)];
      const c2 = [p2[0] - (p3[0] - p1[0]) * t, Math.min(Math.max(p2[1] - (p3[1] - p1[1]) * t, pad.top), pad.top + ih)];
      dpath += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
    }
    return dpath;
  };

  const line = path("value");
  const area = `${line} L${x(data.length - 1)},${pad.top + ih} L${x(0)},${pad.top + ih} Z`;
  const secondary = data.some((d) => d.secondary !== undefined) ? path("secondary") : null;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const every = labelEvery ?? Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(iw / 64))));

  const onMove = (clientX: number, rect: DOMRect) => {
    const rel = clientX - rect.left - pad.left;
    const i = Math.round((rel / iw) * (data.length - 1));
    setHover(Math.min(data.length - 1, Math.max(0, i)));
  };

  const hd = hover !== null ? data[hover] : null;

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 ? (
        <svg
          width={w}
          height={height}
          role="img"
          aria-label={ariaLabel}
          className="overflow-visible"
          onMouseMove={(e) => onMove(e.clientX, e.currentTarget.getBoundingClientRect())}
          onTouchMove={(e) => onMove(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}
          onMouseLeave={() => setHover(null)}
          onTouchEnd={() => setHover(null)}
        >
          <defs>
            <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity="0.2" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
            <clipPath id={`${id}-clip`}>
              <motion.rect x={pad.left - 2} y={0} height={height} initial={{ width: reduce ? iw + 8 : 0 }} animate={{ width: iw + 8 }} transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1] }} />
            </clipPath>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={w - pad.right} y1={y(t)} y2={y(t)} stroke="#e3dcd0" strokeDasharray={t === 0 ? undefined : "2 4"} />
              <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" className="fill-stone-light text-[10.5px]">
                {formatAxis(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) =>
            i % every === 0 ? (
              <text key={i} x={x(i)} y={height - 8} textAnchor="middle" className="fill-stone text-[10.5px]">
                {d.label}
              </text>
            ) : null,
          )}
          <g clipPath={`url(#${id}-clip)`}>
            <path d={area} fill={`url(#${id}-fill)`} />
            {secondary ? <path d={secondary} fill="none" stroke="#9a9388" strokeWidth="1.5" strokeDasharray="4 4" strokeLinecap="round" /> : null}
            <path d={line} fill="none" stroke={color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          {hd && hover !== null ? (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + ih} stroke="#161513" strokeOpacity="0.18" />
              <circle cx={x(hover)} cy={y(hd.value)} r="4.5" fill="#fdfcfa" stroke={color} strokeWidth="2.25" />
              {hd.secondary !== undefined ? <circle cx={x(hover)} cy={y(hd.secondary)} r="3.5" fill="#fdfcfa" stroke="#9a9388" strokeWidth="1.75" /> : null}
            </g>
          ) : null}
        </svg>
      ) : null}
      {hd && hover !== null ? (
        <div
          className="pointer-events-none absolute z-10 min-w-[140px] rounded-md border border-line bg-surface px-3 py-2 text-xs shadow-raised"
          style={{ left: Math.min(Math.max(x(hover) - 70, 0), w - 150), top: 0 }}
          role="status"
        >
          <p className="font-medium text-ink">{hd.tooltipTitle ?? hd.label}</p>
          <p className="mt-1 flex items-center justify-between gap-4 text-stone">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              {primaryName}
            </span>
            <span className="tabular font-semibold text-ink">{formatValue(hd.value)}</span>
          </p>
          {hd.secondary !== undefined && secondaryName ? (
            <p className="mt-0.5 flex items-center justify-between gap-4 text-stone">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-stone-light" />
                {secondaryName}
              </span>
              <span className="tabular font-semibold text-ink">{formatValue(hd.secondary)}</span>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
