"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorNotice } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client/fetcher";
import { usePoll } from "@/lib/client/use-poll";
import { formatMoney, formatRelative, formatTime } from "@/lib/format";
import { ORDER_NEXT_ACTION, ORDER_STATUS, ORDER_TYPE } from "@/lib/labels";
import type { OrderDTO } from "@/server/services/orders";

type Filter = "active" | "today" | "all" | "CANCELLED";

export function OrdersClient({ initial }: { initial: OrderDTO[] }) {
  const [filter, setFilter] = useState<Filter>("active");
  const [open, setOpen] = useState<string | null>(null);
  const toast = useToast();
  const { data, error, refresh, setData } = usePoll<OrderDTO[]>(`/api/staff/orders?filter=${filter}`, initial, 6000);

  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setData([]);
    void refresh();
  }, [filter, refresh, setData]);

  const selected = data.find((o) => o.id === open) ?? null;

  async function setStatus(o: OrderDTO, status: OrderDTO["status"], reason?: string) {
    try {
      await api(`/api/staff/orders/${o.id}`, { method: "PATCH", body: { status, reason } });
      setData((list) => list.map((x) => (x.id === o.id ? { ...x, status } : x)));
      toast.success(`Захиалга #${o.number}: ${ORDER_STATUS[status].label}`);
      void refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function pay(o: OrderDTO, method: "CASH" | "CARD" | "QPAY") {
    try {
      await api(`/api/staff/orders/${o.id}/pay`, { body: { method } });
      setData((list) => list.map((x) => (x.id === o.id ? { ...x, isPaid: true } : x)));
      toast.success(`Захиалга #${o.number}: төлбөр хүлээн авлаа`);
      void refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const counts = useMemo(() => ({ active: data.filter((o) => ["NEW", "CONFIRMED", "PREPARING", "READY"].includes(o.status)).length }), [data]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Захиалгын шүүлтүүр"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "active", label: "Идэвхтэй", count: filter === "active" ? counts.active : undefined },
            { value: "today", label: "Сүүлийн 24 цаг" },
            { value: "all", label: "Бүгд" },
            { value: "CANCELLED", label: "Цуцлагдсан" },
          ]}
        />
        <p className="text-xs text-stone">Автоматаар шинэчлэгдэнэ</p>
      </div>

      {error ? <ErrorNotice message={error} onRetry={() => void refresh()} /> : null}

      {data.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface">
          <EmptyState icon="receipt" title={filter === "active" ? "Идэвхтэй захиалга алга" : "Захиалга олдсонгүй"} description="Шинэ захиалга орж ирэхэд энд шууд харагдана." />
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {data.map((o) => {
              const next = ORDER_NEXT_ACTION[o.status];
              return (
                <motion.li key={o.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.2 }} className="flex flex-col rounded-lg border border-line bg-surface shadow-soft">
                  <button onClick={() => setOpen(o.id)} className="flex-1 p-4 text-left" aria-label={`Захиалга ${o.number} дэлгэрэнгүй`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="tabular text-lg font-semibold leading-none">#{o.number}</p>
                        <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-stone">
                          <Icon name={o.type === "DINE_IN" ? "seat" : o.type === "TAKEAWAY" ? "bag" : "truck"} size={14} />
                          {o.table ? `Ширээ ${o.table}` : ORDER_TYPE[o.type].label}
                          <span aria-hidden="true">·</span>
                          {formatRelative(o.createdAt)}
                        </p>
                      </div>
                      <Badge tone={ORDER_STATUS[o.status].tone} dot>{ORDER_STATUS[o.status].label}</Badge>
                    </div>
                    <ul className="mt-3 space-y-1 text-sm">
                      {o.items.slice(0, 4).map((i) => (
                        <li key={i.id} className="flex gap-2">
                          <span className="tabular w-7 shrink-0 font-medium">{i.quantity}×</span>
                          <span className="min-w-0 truncate">{i.name}</span>
                        </li>
                      ))}
                      {o.items.length > 4 ? <li className="text-xs text-stone">+ өөр {o.items.length - 4} бүтээгдэхүүн</li> : null}
                    </ul>
                  </button>
                  <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-3">
                    <div>
                      <p className="tabular text-[15px] font-semibold">{formatMoney(o.total)}</p>
                      <p className="text-xs text-stone">{o.isPaid ? "Төлөгдсөн" : "Төлбөр авах"}</p>
                    </div>
                    {next ? (
                      <Button size="sm" onClick={() => void setStatus(o, next.to)}>
                        {next.label}
                      </Button>
                    ) : null}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <OrderDetail order={selected} onClose={() => setOpen(null)} onStatus={setStatus} onPay={pay} />
    </div>
  );
}

function OrderDetail({ order, onClose, onStatus, onPay }: { order: OrderDTO | null; onClose: () => void; onStatus: (o: OrderDTO, s: OrderDTO["status"], reason?: string) => Promise<void>; onPay: (o: OrderDTO, m: "CASH" | "CARD" | "QPAY") => Promise<void> }) {
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const next = order ? ORDER_NEXT_ACTION[order.status] : undefined;
  return (
    <Modal
      open={Boolean(order)}
      onClose={() => {
        setCancelling(false);
        onClose();
      }}
      title={order ? `Захиалга #${order.number}` : ""}
      description={order ? `${order.table ? `Ширээ ${order.table}` : ORDER_TYPE[order.type].label}, ${formatTime(order.createdAt)}` : undefined}
      variant="sheet"
      footer={
        order && order.status !== "CANCELLED" && !cancelling ? (
          <>
            {order.status !== "DELIVERED" ? (
              <Button variant="danger" size="sm" onClick={() => setCancelling(true)} className="mr-auto">
                Цуцлах
              </Button>
            ) : null}
            {next ? (
              <Button onClick={() => void onStatus(order, next.to)}>{next.label}</Button>
            ) : null}
          </>
        ) : undefined
      }
    >
      {order ? (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <Badge tone={ORDER_STATUS[order.status].tone} dot>{ORDER_STATUS[order.status].label}</Badge>
            <Badge tone={order.isPaid ? "success" : "warning"}>{order.isPaid ? "Төлөгдсөн" : "Төлбөр хүлээгдэж байна"}</Badge>
          </div>

          <ul className="divide-y divide-line rounded-lg border border-line">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-4 px-3.5 py-3 text-sm">
                <div>
                  <p className="font-medium"><span className="tabular">{i.quantity}×</span> {i.name}</p>
                  {i.options.length > 0 ? <p className="mt-0.5 text-xs text-stone">{i.options.map((o) => o.name).join(", ")}</p> : null}
                  {i.removed.length > 0 ? <p className="mt-0.5 text-xs text-danger">Хасах: {i.removed.join(", ")}</p> : null}
                  {i.note ? <p className="mt-0.5 text-xs text-stone">«{i.note}»</p> : null}
                </div>
                <span className="tabular shrink-0 text-stone">{formatMoney(i.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <dl className="space-y-1 text-sm">
            <div className="flex justify-between text-stone"><dt>Дүн</dt><dd className="tabular">{formatMoney(order.subtotal)}</dd></div>
            {order.serviceFee > 0 ? <div className="flex justify-between text-stone"><dt>Үйлчилгээний хураамж</dt><dd className="tabular">{formatMoney(order.serviceFee)}</dd></div> : null}
            {order.deliveryFee > 0 ? <div className="flex justify-between text-stone"><dt>Хүргэлтийн төлбөр</dt><dd className="tabular">{formatMoney(order.deliveryFee)}</dd></div> : null}
            <div className="flex justify-between text-base font-semibold"><dt>Нийт</dt><dd className="tabular">{formatMoney(order.total)}</dd></div>
          </dl>

          {order.customerName || order.customerPhone || order.deliveryAddress || order.note ? (
            <div className="space-y-1.5 rounded-lg bg-sand/60 p-3.5 text-sm">
              {order.customerName ? <p className="flex items-center gap-2"><Icon name="users" size={14} className="text-stone" />{order.customerName}</p> : null}
              {order.customerPhone ? <p className="flex items-center gap-2"><Icon name="phone" size={14} className="text-stone" /><a href={`tel:${order.customerPhone}`} className="underline underline-offset-2">{order.customerPhone}</a></p> : null}
              {order.deliveryAddress ? <p className="flex items-center gap-2"><Icon name="pin" size={14} className="text-stone" />{order.deliveryAddress}</p> : null}
              {order.note ? <p className="flex items-start gap-2"><Icon name="info" size={14} className="mt-0.5 text-stone" />{order.note}</p> : null}
            </div>
          ) : null}

          {!order.isPaid && order.status !== "CANCELLED" ? (
            <div>
              <p className="mb-2 text-[13px] font-semibold">Төлбөр хүлээн авах</p>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="secondary" size="sm" onClick={() => void onPay(order, "CASH")}>Бэлэн мөнгө</Button>
                <Button variant="secondary" size="sm" onClick={() => void onPay(order, "CARD")}>Карт</Button>
                <Button variant="secondary" size="sm" onClick={() => void onPay(order, "QPAY")}>QPay</Button>
              </div>
            </div>
          ) : null}

          {cancelling ? (
            <div className="space-y-3 rounded-lg border border-danger/20 bg-danger-soft/60 p-4">
              <Field label="Цуцлах шалтгаан" optional>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Жишээ нь: бүтээгдэхүүн дууссан" data-autofocus />
              </Field>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setCancelling(false)}>Болих</Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="!bg-danger hover:!bg-danger/90"
                  onClick={async () => {
                    await onStatus(order, "CANCELLED", reason || undefined);
                    setCancelling(false);
                    setReason("");
                  }}
                >
                  Захиалгыг цуцлах
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
