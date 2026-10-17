"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { RestaurantMark } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { ErrorNotice } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { usePoll } from "@/lib/client/use-poll";
import { formatMoney, formatTime } from "@/lib/format";
import { CUSTOMER_STEPS, ORDER_STATUS, ORDER_TYPE } from "@/lib/labels";
import type { PublicOrderDTO } from "@/server/services/orders";

const MESSAGES: Record<string, { title: string; text: string }> = {
  NEW: { title: "Захиалга хүлээн авлаа.", text: "Ресторан таны захиалгыг шалгаж байна." },
  CONFIRMED: { title: "Захиалга баталгаажлаа.", text: "Удахгүй бэлтгэж эхэлнэ." },
  PREPARING: { title: "Таны хоол бэлтгэгдэж байна.", text: "Тогооч одоо таны захиалгыг хийж байна." },
  READY: { title: "Захиалга бэлэн боллоо.", text: "Удахгүй танд үйлчилнэ." },
  DELIVERED: { title: "Үйлчилж байна.", text: "Хоолоо сайхан хүртээрэй." },
  CANCELLED: { title: "Захиалга цуцлагдлаа.", text: "Дэлгэрэнгүйг рестораноос лавлана уу." },
};

export function OrderTracker({ initial, token }: { initial: PublicOrderDTO; token: string }) {
  const { data: order, error } = usePoll<PublicOrderDTO>(`/api/public/orders/${token}`, initial, 4000);
  const cancelled = order.status === "CANCELLED";
  const stepIndex = CUSTOMER_STEPS.findIndex((s) => s.statuses.includes(order.status));
  const msg = MESSAGES[order.status];
  const accent = order.restaurant.brandColor;

  return (
    <div className="min-h-dvh bg-paper">
      <div className="mx-auto max-w-lg px-4 py-6 sm:py-10">
        <Link href={`/r/${order.restaurant.slug}`} className="mb-6 inline-flex items-center gap-1.5 text-sm text-stone hover:text-ink">
          <Icon name="arrowLeft" size={15} />
          Меню руу буцах
        </Link>

        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-raised">
          <div className="border-b border-line px-5 py-5 text-center">
            <motion.div
              key={order.status}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.35, duration: 0.5 }}
              className={cn("mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full", cancelled ? "bg-danger-soft text-danger" : "text-white")}
              style={cancelled ? undefined : { backgroundColor: accent }}
            >
              <Icon name={cancelled ? "x" : order.status === "PREPARING" ? "flame" : "check"} size={26} strokeWidth={2} />
            </motion.div>
            <h1 className="font-serif text-2xl tracking-[-0.02em]" aria-live="polite">{msg.title}</h1>
            <p className="mt-1 text-sm text-stone">{msg.text}</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Badge tone="neutral">Захиалга #{order.number}</Badge>
              <Badge tone="neutral">{order.table ? `Ширээ ${order.table}` : ORDER_TYPE[order.type].label}</Badge>
            </div>
          </div>

          {!cancelled ? (
            <ol className="space-y-0 px-6 py-6" aria-label="Захиалгын явц">
              {CUSTOMER_STEPS.map((s, i) => {
                const done = i < stepIndex || (i === stepIndex && order.status === "DELIVERED");
                const current = i === stepIndex && !done;
                return (
                  <li key={s.key} className="relative flex gap-4 pb-6 last:pb-0" aria-current={current ? "step" : undefined}>
                    {i < CUSTOMER_STEPS.length - 1 ? (
                      <span className="absolute left-[13px] top-7 h-[calc(100%-28px)] w-px bg-line">
                        <motion.span className="block w-full" style={{ backgroundColor: accent }} initial={false} animate={{ height: i < stepIndex ? "100%" : "0%" }} transition={{ duration: 0.5 }} />
                      </span>
                    ) : null}
                    <span
                      className={cn("relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-white transition-colors", !done && !current && "border-line bg-surface")}
                      style={done || current ? { backgroundColor: accent, borderColor: accent } : undefined}
                    >
                      {done ? <Icon name="check" size={14} strokeWidth={2.4} /> : current ? <span className="h-2 w-2 animate-pulse-soft rounded-full bg-white" /> : null}
                    </span>
                    <div className="pt-0.5">
                      <p className={cn("text-[15px] font-medium", !done && !current && "text-stone-light")}>{s.label}</p>
                      {i === 0 ? <p className="text-xs text-stone">{formatTime(order.createdAt)}</p> : null}
                      {s.key === "preparing" && order.startedAt ? <p className="text-xs text-stone">{formatTime(order.startedAt)}</p> : null}
                      {s.key === "ready" && order.readyAt ? <p className="text-xs text-stone">{formatTime(order.readyAt)}</p> : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : null}

          {error ? (
            <div className="px-5 pb-4">
              <ErrorNotice message="Төлөв шинэчлэхэд алдаа гарлаа. Холболтоо шалгана уу." />
            </div>
          ) : null}

          <div className="border-t border-line bg-paper/60 px-5 py-5">
            <p className="mb-3 flex items-center gap-2.5 text-sm font-semibold">
              <RestaurantMark name={order.restaurant.name} color={accent} size={24} />
              {order.restaurant.name}
            </p>
            <ul className="space-y-2 text-sm">
              {order.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4">
                  <span>
                    <span className="tabular font-medium">{i.quantity} ×</span> {i.name}
                    {i.options.length > 0 ? <span className="block text-xs text-stone">{i.options.map((o) => o.name).join(", ")}</span> : null}
                  </span>
                  <span className="tabular text-stone">{formatMoney(i.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-line pt-3 text-sm">
              {order.serviceFee > 0 ? (
                <div className="flex justify-between text-stone">
                  <dt>Үйлчилгээний хураамж</dt>
                  <dd className="tabular">{formatMoney(order.serviceFee)}</dd>
                </div>
              ) : null}
              {order.deliveryFee > 0 ? (
                <div className="flex justify-between text-stone">
                  <dt>Хүргэлтийн төлбөр</dt>
                  <dd className="tabular">{formatMoney(order.deliveryFee)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between text-base font-semibold">
                <dt>Нийт</dt>
                <dd className="tabular">{formatMoney(order.total)}</dd>
              </div>
              <div className="flex justify-between text-xs text-stone">
                <dt>Төлбөр</dt>
                <dd>{order.isPaid ? "Төлөгдсөн" : "Кассанд төлнө"}</dd>
              </div>
            </dl>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-stone-light">
          Төлөв {ORDER_STATUS[order.status].label.toLowerCase()}. Хуудас өөрөө шинэчлэгдэнэ.
        </p>
      </div>
    </div>
  );
}
