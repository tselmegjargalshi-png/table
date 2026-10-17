"use client";

import { useEffect, useRef, useState } from "react";
import { StatCard } from "@/components/app/stat-card";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart, HBars } from "@/components/charts/bar-chart";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState, ErrorNotice } from "@/components/ui/feedback";
import { Segmented } from "@/components/ui/segmented";
import { api } from "@/lib/client/fetcher";
import { formatDate, formatMoney, formatMoneyShort, formatNumber, WEEKDAYS } from "@/lib/format";
import type { AnalyticsData } from "@/server/services/analytics";

const pad = (n: number) => String(n).padStart(2, "0");

export function AnalyticsClient({ initial }: { initial: AnalyticsData }) {
  const [range, setRange] = useState<7 | 30 | 90>(initial.range as 7 | 30 | 90);
  const [data, setData] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const first = useRef(true);

  async function load(r: number) {
    setLoading(true);
    try {
      setData(await api<AnalyticsData>(`/api/staff/analytics?range=${r}`));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    void load(range);
  }, [range]);

  const totalTypes = data.types.dineIn + data.types.takeaway + data.types.delivery;
  const topItem = data.topItems[0];
  const topCat = data.topCategories[0];

  return (
    <div className="space-y-5" aria-busy={loading}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Хугацааны хязгаар" value={String(range) as "7" | "30" | "90"} onChange={(v) => setRange(Number(v) as 7 | 30 | 90)} options={[{ value: "7", label: "7 хоног" }, { value: "30", label: "30 хоног" }, { value: "90", label: "90 хоног" }]} />
        <p className="text-xs text-stone">Улаанбаатарын цагаар</p>
      </div>
      {error ? <ErrorNotice message={error} onRetry={() => void load(range)} /> : null}

      <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard label="Өдрийн борлуулалт" value={formatMoneyShort(data.todayRevenue)} icon="wallet" tone="accent" hint="өнөөдөр" />
          <StatCard label="7 хоногийн борлуулалт" value={formatMoneyShort(data.weekRevenue)} icon="chart" hint="сүүлийн 7 хоног" />
          <StatCard label="Сарын борлуулалт" value={formatMoneyShort(data.monthRevenue)} icon="calendar" hint="энэ сарын эхнээс" />
          <StatCard label="Захиалгын тоо" value={formatNumber(data.totalOrders)} icon="receipt" delta={data.ordersChange} hint={`${range} хоногт`} />
          <StatCard label="Дундаж захиалга" value={formatMoney(data.avgOrder)} icon="bag" hint="нэг захиалгын дүн" />
          <StatCard label="Шилдэг бүтээгдэхүүн" value={<span className="block truncate text-[22px]">{topItem?.name ?? "Мэдээлэл алга"}</span>} icon="star" hint={topItem ? `${topItem.quantity} ширхэг зарагдсан` : undefined} />
          <StatCard label="Шилдэг ангилал" value={<span className="block truncate text-[22px]">{topCat?.name ?? "Мэдээлэл алга"}</span>} icon="book" hint={topCat ? formatMoneyShort(topCat.revenue) : undefined} />
          <StatCard label="Оргил цаг" value={data.peakHour !== null ? `${pad(data.peakHour)}:00` : "Мэдээлэл алга"} icon="clock" hint="хамгийн их захиалгатай" />
        </div>

        <Card className="mt-5">
          <CardHeader title="Борлуулалтын өөрчлөлт" description={`Сүүлийн ${range} хоног, нийт ${formatMoney(data.totalRevenue)}`} action={data.revenueChange !== null ? <span className={`tabular rounded px-2 py-1 text-xs font-medium ${data.revenueChange >= 0 ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}>{data.revenueChange >= 0 ? "+" : ""}{data.revenueChange}% өмнөх үеэс</span> : null} />
          <div className="px-3 pb-4 pt-5 sm:px-5">
            {data.totalOrders === 0 ? (
              <EmptyState icon="chart" title="Энэ хугацаанд борлуулалт алга" />
            ) : (
              <AreaChart
                data={data.series.map((d) => {
                  const dt = new Date(`${d.date}T12:00:00+08:00`);
                  return { label: `${dt.getUTCMonth() + 1}/${dt.getUTCDate()}`, value: d.revenue, tooltipTitle: `${formatDate(dt)} (${WEEKDAYS[new Date(`${d.date}T12:00:00+08:00`).getUTCDay()]})` };
                })}
                height={290}
                ariaLabel={`Сүүлийн ${range} хоногийн өдөр тутмын борлуулалт`}
              />
            )}
          </div>
        </Card>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Цагийн ачаалал" description="Захиалгын тоо цагаар" />
            <div className="px-3 pb-4 pt-5 sm:px-5">
              <BarChart
                data={data.hours.filter((h) => h.hour >= 8 && h.hour <= 23).map((h) => ({ label: pad(h.hour), value: h.orders, tooltipTitle: `${pad(h.hour)}:00 - ${pad(h.hour + 1 > 23 ? 0 : h.hour + 1)}:00`, highlight: h.hour === data.peakHour }))}
                formatValue={(v) => `${formatNumber(Math.round(v))}`}
                valueName="Захиалга"
                ariaLabel="Цаг тутмын захиалгын тоо"
              />
            </div>
          </Card>
          <Card>
            <CardHeader title="Гарагаар" description="Борлуулалтын дүн" />
            <div className="px-3 pb-4 pt-5 sm:px-5">
              <BarChart
                data={data.weekdays.map((w) => ({ label: WEEKDAYS[w.dow].slice(0, 2), value: w.revenue, tooltipTitle: WEEKDAYS[w.dow], highlight: w.revenue === Math.max(...data.weekdays.map((x) => x.revenue)) && w.revenue > 0 }))}
                ariaLabel="Гарагаар борлуулалт"
              />
            </div>
          </Card>
          <Card>
            <CardHeader title="Шилдэг бүтээгдэхүүн" description="Борлуулалтын дүнгээр" />
            <div className="p-5">
              {data.topItems.length ? <HBars rows={data.topItems.map((t) => ({ name: t.name, value: t.revenue, sub: `${t.quantity} ш` }))} formatValue={formatMoneyShort} /> : <EmptyState icon="book" title="Мэдээлэл алга" className="py-8" />}
            </div>
          </Card>
          <Card>
            <CardHeader title="Шилдэг ангилал" description="Борлуулалтын дүнгээр" />
            <div className="p-5">
              {data.topCategories.length ? <HBars rows={data.topCategories.map((t) => ({ name: t.name, value: t.revenue }))} formatValue={formatMoneyShort} /> : <EmptyState icon="book" title="Мэдээлэл алга" className="py-8" />}
            </div>
          </Card>
        </div>

        <Card className="mt-5">
          <CardHeader title="Захиалгын төрөл" description={`${range} хоногийн хуваарилалт`} />
          <div className="grid gap-5 p-5 sm:grid-cols-4">
            {[
              ["Ширээн дээрээс", data.types.dineIn],
              ["Аваад явах", data.types.takeaway],
              ["Хүргэлт", data.types.delivery],
              ["Цуцлагдсан", data.types.cancelled],
            ].map(([l, v]) => (
              <div key={l as string}>
                <p className="tabular text-2xl font-semibold">{formatNumber(v as number)}</p>
                <p className="text-[13px] text-stone">{l}</p>
                {l !== "Цуцлагдсан" && totalTypes > 0 ? <p className="tabular mt-0.5 text-xs text-stone-light">{Math.round(((v as number) / totalTypes) * 100)}%</p> : null}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
