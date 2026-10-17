"use client";

import Link from "next/link";
import { useMemo } from "react";
import { StatCard } from "@/components/app/stat-card";
import { AreaChart } from "@/components/charts/area-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState, ErrorNotice } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { usePoll } from "@/lib/client/use-poll";
import { formatMoney, formatMoneyShort, formatRelative } from "@/lib/format";
import { ORDER_STATUS, ORDER_TYPE } from "@/lib/labels";
import type { DashboardData } from "@/server/services/analytics";

export function DashboardClient({ initial }: { initial: DashboardData }) {
  const { data, error, refresh } = usePoll<DashboardData>("/api/staff/dashboard", initial, 15000);

  const series = useMemo(() => {
    const start = 8;
    const end = Math.max(data.currentHour, start + 1);
    let a = 0;
    let b = 0;
    const out = [];
    for (let h = 0; h <= 23; h++) {
      a += data.series[h].today;
      b += data.series[h].yesterday;
      if (h >= start && h <= end) out.push({ label: `${String(h).padStart(2, "0")}:00`, value: a, secondary: b, tooltipTitle: `${String(h).padStart(2, "0")}:00 цаг хүртэл` });
    }
    return out;
  }, [data]);

  return (
    <div className="space-y-5">
      {error ? <ErrorNotice message={`${error}`} onRetry={() => void refresh()} /> : null}

      {data.pendingOrders > 0 ? (
        <Link href="/app/orders" className="group flex items-center justify-between gap-3 rounded-lg border border-ember/25 bg-ember-soft px-4 py-3 text-sm transition-colors hover:border-ember/50">
          <span className="flex items-center gap-2.5 font-medium text-ember-dark">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ember" />
            </span>
            {data.pendingOrders} захиалга хийгдэхийг хүлээж байна
          </span>
          <span className="flex items-center gap-1 text-ember-dark">
            Харах <Icon name="arrowRight" size={15} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        <StatCard label="Өнөөдрийн борлуулалт" value={formatMoney(data.todayRevenue)} icon="wallet" tone="accent" delta={data.revenueChange} hint="өчигдөртэй харьцуулахад" />
        <StatCard label="Өнөөдрийн захиалга" value={data.todayOrders} icon="receipt" hint={`Өчигдөр ижил цагт ${data.yesterdayOrders}`} />
        <StatCard label="Дундаж захиалга" value={formatMoney(data.avgOrder)} icon="chart" hint="нэг захиалгын дүн" />
        <StatCard label="Идэвхтэй ширээ" value={`${data.activeTables}/${data.totalTables}`} icon="table" hint={data.totalTables ? `${Math.round((data.activeTables / data.totalTables) * 100)}% дүүргэлт` : undefined} />
        <StatCard label="Хүлээгдэж буй захиалга" value={data.pendingOrders} icon="clock" hint="шинэ, баталгаажсан, бэлтгэж буй" />
        <StatCard label="Өчигдрийн захиалга" value={data.yesterdayOrders} icon="calendar" hint="өдрийн энэ цаг хүртэл" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader
            title="Өнөөдрийн борлуулалт"
            description="Цаг тутмын хуримтлагдсан дүн"
            action={
              <div className="flex items-center gap-3 text-xs text-stone">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ember" />Өнөөдөр</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-stone-light" />Өчигдөр</span>
              </div>
            }
          />
          <div className="px-3 pb-4 pt-5 sm:px-5">
            {data.todayRevenue === 0 && data.yesterdayRevenue === 0 ? (
              <EmptyState icon="chart" title="Өнөөдөр борлуулалт бүртгэгдээгүй байна" description="Эхний захиалга орж ирмэгц график энд харагдана." />
            ) : (
              <AreaChart data={series} ariaLabel={`Өнөөдрийн борлуулалт ${formatMoney(data.todayRevenue)}, өчигдөр ${formatMoney(data.yesterdayRevenue)}`} secondaryName="Өчигдөр" primaryName="Өнөөдөр" formatValue={formatMoneyShort} />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Дүгнэлт" description="Бодит тоон дээр тулгуурласан" />
          <ul className="divide-y divide-line">
            {data.insights.length === 0 ? (
              <li className="px-5 py-8 text-center text-sm text-stone">Дүгнэлт гаргахад хангалттай өгөгдөл хараахан байхгүй байна.</li>
            ) : (
              data.insights.map((t) => (
                <li key={t} className="flex gap-3 px-5 py-3.5 text-sm leading-relaxed">
                  <Icon name="info" size={16} className="mt-0.5 shrink-0 text-ember" />
                  {t}
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader title="Сүүлийн захиалгууд" action={<Link href="/app/orders" className="text-[13px] font-medium text-stone underline-offset-4 hover:text-ink hover:underline">Бүгдийг харах</Link>} />
        {data.recent.length === 0 ? (
          <EmptyState icon="receipt" title="Захиалга алга" description="Үйлчлүүлэгч QR кодоор захиалахад энд харагдана." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-stone">
                  <th className="px-5 py-2.5 font-medium">Дугаар</th>
                  <th className="px-3 py-2.5 font-medium">Төрөл</th>
                  <th className="px-3 py-2.5 font-medium">Төлөв</th>
                  <th className="px-3 py-2.5 font-medium">Хугацаа</th>
                  <th className="px-5 py-2.5 text-right font-medium">Дүн</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.recent.map((o) => (
                  <tr key={o.id} className="transition-colors hover:bg-paper/60">
                    <td className="tabular px-5 py-3 font-medium">#{o.number}</td>
                    <td className="px-3 py-3 text-stone">{o.table ? `Ширээ ${o.table}` : ORDER_TYPE[o.type].label}</td>
                    <td className="px-3 py-3"><Badge tone={ORDER_STATUS[o.status].tone} dot>{ORDER_STATUS[o.status].label}</Badge></td>
                    <td className="px-3 py-3 text-stone">{formatRelative(o.createdAt)}</td>
                    <td className="tabular px-5 py-3 text-right font-medium">{formatMoney(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
