// Мөнгө, огноо, цагийг монгол хэлний хэвшилд нийцүүлэн форматлах туслах функцууд.

export const TZ = "Asia/Ulaanbaatar";

const numberFmt = new Intl.NumberFormat("en-US");

/** 18000 → "18,000₮" */
export function formatMoney(value: number): string {
  return `${numberFmt.format(Math.round(value))}₮`;
}

/** 1240000 → "1.24 сая₮" маягийн товч хэлбэр */
export function formatMoneyShort(value: number): string {
  if (value >= 1_000_000) {
    const v = value / 1_000_000;
    return `${v.toFixed(v >= 10 ? 1 : 2).replace(/\.?0+$/, "")} сая₮`;
  }
  if (value >= 10_000) return `${Math.round(value / 1000)} мян₮`;
  return formatMoney(value);
}

export function formatNumber(value: number): string {
  return numberFmt.format(value);
}

const MONTHS = [
  "1-р сар", "2-р сар", "3-р сар", "4-р сар", "5-р сар", "6-р сар",
  "7-р сар", "8-р сар", "9-р сар", "10-р сар", "11-р сар", "12-р сар",
];

export const WEEKDAYS = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];
export const WEEKDAYS_SHORT = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];

type Parts = { year: number; month: number; day: number; hour: number; minute: number; weekday: number };

const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
  weekday: "short",
});

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Огноог Улаанбаатарын цагийн бүсээр задлах */
export function ubParts(date: Date | string | number): Parts {
  const d = new Date(date);
  const out: Record<string, string> = {};
  for (const p of partsFmt.formatToParts(d)) out[p.type] = p.value;
  return {
    year: Number(out.year),
    month: Number(out.month),
    day: Number(out.day),
    hour: Number(out.hour),
    minute: Number(out.minute),
    weekday: WEEKDAY_INDEX[out.weekday] ?? 0,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "14:05" */
export function formatTime(date: Date | string | number): string {
  const p = ubParts(date);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** "10-р сарын 17" */
export function formatDate(date: Date | string | number): string {
  const p = ubParts(date);
  return `${MONTHS[p.month - 1].replace(" сар", " сарын")} ${p.day}`;
}

/** "2026.10.17" */
export function formatDateNumeric(date: Date | string | number): string {
  const p = ubParts(date);
  return `${p.year}.${pad(p.month)}.${pad(p.day)}`;
}

export function formatDateTime(date: Date | string | number): string {
  return `${formatDate(date)}, ${formatTime(date)}`;
}

/** "04:32" маягаар өнгөрсөн хугацаа */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** "12 минут", "1 цаг 20 минут" */
export function formatDuration(ms: number): string {
  const min = Math.max(0, Math.round(ms / 60000));
  if (min < 60) return `${min} минут`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} цаг ${m} минут` : `${h} цаг`;
}

/** "5 минутын өмнө" */
export function formatRelative(date: Date | string | number, now = Date.now()): string {
  const diff = now - new Date(date).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "Дөнгөж сая";
  if (min < 60) return `${min} минутын өмнө`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} цагийн өмнө`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} өдрийн өмнө`;
  return formatDateNumeric(date);
}

/** Улаанбаатарын цагаар тухайн өдрийн эхлэл (UTC Date) */
export function startOfUbDay(date: Date | number = Date.now(), offsetDays = 0): Date {
  const p = ubParts(date);
  // Улаанбаатар UTC+8, зуны цаггүй
  return new Date(Date.UTC(p.year, p.month - 1, p.day + offsetDays, -8, 0, 0));
}

/** Analytics хүснэгтийн @db.Date талбарт хадгалах огноо */
export function ubDateKey(date: Date | number = Date.now()): Date {
  const p = ubParts(date);
  return new Date(Date.UTC(p.year, p.month - 1, p.day));
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 8) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return phone;
}
