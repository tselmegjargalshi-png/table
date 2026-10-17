"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, IconButton } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { ErrorNotice } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";
import { api, ClientError } from "@/lib/client/fetcher";
import { formatMoney } from "@/lib/format";
import { ORDER_TYPE } from "@/lib/labels";
import type { RestaurantDTO } from "@/lib/menu-types";
import { MenuImage } from "./menu-image";
import type { CartLine } from "./use-cart";

type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";
type Pay = "CASH" | "QPAY";

export function CartPanel({
  restaurant,
  lines,
  setQty,
  clear,
  table,
  onDone,
}: {
  restaurant: RestaurantDTO;
  lines: CartLine[];
  setQty: (key: string, q: number) => void;
  clear: () => void;
  table: { number: number; code: string } | null;
  onDone?: () => void;
}) {
  const router = useRouter();
  const modes = useMemo(
    () =>
      (["DINE_IN", "TAKEAWAY", "DELIVERY"] as const).filter((m) =>
        m === "DINE_IN" ? restaurant.allowDineIn : m === "TAKEAWAY" ? restaurant.allowTakeaway : restaurant.allowDelivery,
      ),
    [restaurant],
  );
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [type, setType] = useState<OrderType>(table && modes.includes("DINE_IN") ? "DINE_IN" : modes[0] ?? "TAKEAWAY");
  const [tableNumber, setTableNumber] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [pay, setPay] = useState<Pay>("CASH");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const serviceFee = type === "DINE_IN" ? Math.round((subtotal * restaurant.serviceFeePercent) / 100) : 0;
  const deliveryFee = type === "DELIVERY" ? restaurant.deliveryFee : 0;
  const total = subtotal + serviceFee + deliveryFee;

  async function submit() {
    setBusy(true);
    setError(null);
    setFields({});
    try {
      const res = await api<{ number: number; publicToken: string }>(`/api/public/${restaurant.slug}/orders`, {
        body: {
          type,
          tableCode: type === "DINE_IN" && table ? table.code : undefined,
          tableNumber: type === "DINE_IN" && !table ? Number(tableNumber) || undefined : undefined,
          customerName: name || undefined,
          customerPhone: phone || undefined,
          deliveryAddress: type === "DELIVERY" ? address : undefined,
          note: note || undefined,
          paymentMethod: pay,
          lines: lines.map((l) => ({ itemId: l.itemId, quantity: l.quantity, optionIds: l.optionIds, removed: l.removed, note: l.note })),
        },
      });
      clear();
      onDone?.();
      router.push(`/r/${restaurant.slug}/order/${res.publicToken}`);
    } catch (err) {
      const e = err as ClientError;
      setError(e.message);
      setFields(e.fields ?? {});
      setBusy(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sand text-stone">
          <Icon name="bag" size={24} />
        </div>
        <p className="font-semibold">Сагс хоосон байна</p>
        <p className="mt-1 text-sm text-stone">Менюнээс хоолоо сонгоод сагсандаа нэмнэ үү.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <AnimatePresence mode="wait" initial={false}>
        {step === "cart" ? (
          <motion.div key="cart" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }} className="flex-1 overflow-y-auto">
            <ul className="divide-y divide-line">
              <AnimatePresence initial={false}>
                {lines.map((l) => (
                  <motion.li key={l.key} layout exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="flex gap-3 py-3.5">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-sand">
                      <MenuImage imageUrl={l.imageUrl} artKey={l.artKey} name={l.name} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">{l.name}</p>
                      {l.optionNames.length > 0 || l.removed.length > 0 || l.note ? (
                        <p className="mt-0.5 text-xs leading-relaxed text-stone">
                          {[...l.optionNames, ...l.removed.map((r) => `${r} хасах`), l.note].filter(Boolean).join(", ")}
                        </p>
                      ) : null}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center rounded-md border border-line">
                          <IconButton icon="minus" label={`${l.name} хасах`} size="xs" onClick={() => setQty(l.key, l.quantity - 1)} />
                          <span className="tabular w-7 text-center text-[13px] font-semibold">{l.quantity}</span>
                          <IconButton icon="plus" label={`${l.name} нэмэх`} size="xs" onClick={() => setQty(l.key, l.quantity + 1)} />
                        </div>
                        <span className="tabular text-sm font-medium">{formatMoney(l.unitPrice * l.quantity)}</span>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </motion.div>
        ) : (
          <motion.div key="checkout" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.18 }} className="flex-1 space-y-5 overflow-y-auto pb-2">
            <button onClick={() => setStep("cart")} className="inline-flex items-center gap-1 text-[13px] font-medium text-stone hover:text-ink">
              <Icon name="arrowLeft" size={14} />
              Сагс руу буцах
            </button>

            <div>
              <p className="mb-2 text-[13px] font-semibold text-charcoal">Захиалгын төрөл</p>
              <div className={cn("grid gap-2", modes.length === 3 ? "grid-cols-3" : modes.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
                {modes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={type === m}
                    onClick={() => setType(m)}
                    className={cn("flex flex-col items-center gap-1.5 rounded-md border px-2 py-3 text-[13px] font-medium transition-colors", type === m ? "border-ink bg-ink text-paper" : "border-line bg-surface hover:border-line-strong")}
                  >
                    <Icon name={m === "DINE_IN" ? "seat" : m === "TAKEAWAY" ? "bag" : "truck"} size={18} />
                    {ORDER_TYPE[m].label}
                  </button>
                ))}
              </div>
            </div>

            {type === "DINE_IN" ? (
              table ? (
                <div className="flex items-center gap-3 rounded-md border border-line bg-sand/60 px-4 py-3">
                  <Icon name="seat" size={18} className="text-stone" />
                  <div>
                    <p className="text-sm font-semibold">Ширээ {table.number}</p>
                    <p className="text-xs text-stone">QR кодоос автоматаар таарлаа</p>
                  </div>
                </div>
              ) : (
                <Field label="Ширээний дугаар" error={fields.tableNumber}>
                  <Input inputMode="numeric" value={tableNumber} onChange={(e) => setTableNumber(e.target.value.replace(/\D/g, ""))} placeholder="Жишээ нь: 12" />
                </Field>
              )
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Нэр" optional={type === "DINE_IN"} error={fields.customerName}>
                <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </Field>
              <Field label="Утасны дугаар" optional={type !== "DELIVERY"} error={fields.customerPhone}>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="9911 2233" />
              </Field>
            </div>

            {type === "DELIVERY" ? (
              <Field label="Хүргэлтийн хаяг" error={fields.deliveryAddress}>
                <Textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Дүүрэг, хороо, байр, орц, тоот" />
              </Field>
            ) : null}

            <Field label="Захиалгын тэмдэглэл" optional>
              <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
            </Field>

            <div>
              <p className="mb-2 text-[13px] font-semibold text-charcoal">Төлбөр</p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["CASH", "Кассанд төлөх", "wallet"],
                    ["QPAY", "QPay (туршилтын горим)", "qr"],
                  ] as const
                ).map(([v, label, icon]) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={pay === v}
                    onClick={() => setPay(v)}
                    className={cn("flex items-center gap-2 rounded-md border px-3 py-2.5 text-left text-[13px] font-medium transition-colors", pay === v ? "border-ink bg-surface ring-1 ring-ink" : "border-line hover:border-line-strong")}
                  >
                    <Icon name={icon} size={16} className="shrink-0 text-stone" />
                    {label}
                  </button>
                ))}
              </div>
              {pay === "QPAY" ? <p className="mt-2 text-xs text-stone">Туршилтын горимд бодит гүйлгээ хийгдэхгүй.</p> : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-3 space-y-3 border-t border-line pt-4">
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between text-stone">
            <dt>Дүн</dt>
            <dd className="tabular">{formatMoney(subtotal)}</dd>
          </div>
          {step === "checkout" && serviceFee > 0 ? (
            <div className="flex justify-between text-stone">
              <dt>Үйлчилгээний хураамж ({restaurant.serviceFeePercent}%)</dt>
              <dd className="tabular">{formatMoney(serviceFee)}</dd>
            </div>
          ) : null}
          {step === "checkout" && deliveryFee > 0 ? (
            <div className="flex justify-between text-stone">
              <dt>Хүргэлтийн төлбөр</dt>
              <dd className="tabular">{formatMoney(deliveryFee)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between text-base font-semibold">
            <dt>Нийт</dt>
            <dd className="tabular">{formatMoney(step === "cart" ? subtotal : total)}</dd>
          </div>
        </dl>
        {step === "cart" && restaurant.serviceFeePercent > 0 ? <p className="text-xs text-stone">Ширээн дээр хэрэглэвэл {restaurant.serviceFeePercent}% үйлчилгээний хураамж нэмэгдэнэ.</p> : null}
        {error ? <ErrorNotice message={error} /> : null}
        {step === "cart" ? (
          <Button size="lg" className="w-full text-white" style={{ backgroundColor: restaurant.brandColor }} onClick={() => setStep("checkout")} iconRight="arrowRight">
            Захиалга өгөх
          </Button>
        ) : (
          <Button size="lg" className="w-full text-white" style={{ backgroundColor: restaurant.brandColor }} loading={busy} onClick={submit}>
            Захиалгаа баталгаажуулах · {formatMoney(total)}
          </Button>
        )}
      </div>
    </div>
  );
}
