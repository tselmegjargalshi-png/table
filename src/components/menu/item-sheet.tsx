"use client";

import { useMemo, useState } from "react";
import { Button, IconButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import type { MenuItemDTO } from "@/lib/menu-types";
import type { CartLine } from "./use-cart";
import { MenuImage } from "./menu-image";

export function ItemSheet({
  item,
  open,
  onClose,
  onAdd,
  accent,
  orderingEnabled,
}: {
  item: MenuItemDTO | null;
  open: boolean;
  onClose: () => void;
  onAdd: (line: Omit<CartLine, "key">, source: DOMRect | null) => void;
  accent: string;
  orderingEnabled: boolean;
}) {
  return (
    <Modal open={open && Boolean(item)} onClose={onClose} title={item?.name ?? ""} variant="dialog" size="md">
      {item ? <ItemForm key={item.id} item={item} onAdd={onAdd} onClose={onClose} accent={accent} orderingEnabled={orderingEnabled} /> : null}
    </Modal>
  );
}

function ItemForm({ item, onAdd, onClose, accent, orderingEnabled }: { item: MenuItemDTO; onAdd: (line: Omit<CartLine, "key">, source: DOMRect | null) => void; onClose: () => void; accent: string; orderingEnabled: boolean }) {
  const groups = useMemo(() => {
    const map = new Map<string, typeof item.options>();
    for (const o of item.options.filter((o) => o.kind === "OPTION")) {
      const g = o.groupName ?? "Сонголт";
      map.set(g, [...(map.get(g) ?? []), o]);
    }
    return [...map.entries()];
  }, [item]);
  const addons = item.options.filter((o) => o.kind === "ADDON");

  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const [g, opts] of groups) init[g] = (opts.find((o) => o.isDefault) ?? opts[0]).id;
    return init;
  });
  const [chosenAddons, setChosenAddons] = useState<Set<string>>(new Set());
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  const optionIds = [...Object.values(selected), ...chosenAddons];
  const picked = item.options.filter((o) => optionIds.includes(o.id));
  const unit = item.price + picked.reduce((s, o) => s + o.priceDelta, 0);

  const toggle = <T,>(set: Set<T>, v: T) => {
    const n = new Set(set);
    if (n.has(v)) n.delete(v);
    else n.add(v);
    return n;
  };

  return (
    <div className="-mx-5 -my-5">
      <div className="aspect-[16/10] w-full overflow-hidden bg-sand">
        <MenuImage imageUrl={item.imageUrl} artKey={item.artKey} name={item.name} priority />
      </div>
      <div className="space-y-6 px-5 py-5">
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-serif text-2xl tracking-[-0.02em]">{item.name}</p>
            <p className="tabular text-lg font-semibold">{formatMoney(item.price)}</p>
          </div>
          {item.description ? <p className="mt-1.5 text-sm leading-relaxed text-stone">{item.description}</p> : null}
          <p className="mt-2 flex items-center gap-1.5 text-xs text-stone">
            <Icon name="clock" size={13} />
            Бэлтгэх хугацаа ойролцоогоор {item.prepMinutes} минут
          </p>
        </div>

        {groups.map(([group, opts]) => (
          <fieldset key={group}>
            <legend className="mb-2 text-[13px] font-semibold text-charcoal">{group}</legend>
            <div className="space-y-1.5">
              {opts.map((o) => {
                const active = selected[group] === o.id;
                return (
                  <label key={o.id} className={cn("flex cursor-pointer items-center justify-between gap-3 rounded-md border px-3.5 py-2.5 text-sm transition-colors", active ? "border-ink bg-surface" : "border-line hover:border-line-strong")}>
                    <span className="flex items-center gap-3">
                      <input type="radio" name={group} checked={active} onChange={() => setSelected((s) => ({ ...s, [group]: o.id }))} className="sr-only" />
                      <span className={cn("flex h-4.5 w-4.5 items-center justify-center rounded-full border", active ? "border-ink" : "border-line-strong")} style={{ width: 18, height: 18 }}>
                        {active ? <span className="h-2.5 w-2.5 rounded-full bg-ink" /> : null}
                      </span>
                      {o.name}
                    </span>
                    <span className="tabular text-stone">{o.priceDelta ? `+${formatMoney(o.priceDelta)}` : ""}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}

        {addons.length > 0 ? (
          <fieldset>
            <legend className="mb-2 text-[13px] font-semibold text-charcoal">Нэмэлт</legend>
            <div className="space-y-1.5">
              {addons.map((o) => {
                const active = chosenAddons.has(o.id);
                return (
                  <label key={o.id} className={cn("flex cursor-pointer items-center justify-between gap-3 rounded-md border px-3.5 py-2.5 text-sm transition-colors", active ? "border-ink bg-surface" : "border-line hover:border-line-strong")}>
                    <span className="flex items-center gap-3">
                      <input type="checkbox" checked={active} onChange={() => setChosenAddons((s) => toggle(s, o.id))} className="sr-only" />
                      <span className={cn("flex items-center justify-center rounded-[4px] border", active ? "border-ink bg-ink text-paper" : "border-line-strong")} style={{ width: 18, height: 18 }}>
                        {active ? <Icon name="check" size={12} strokeWidth={2.4} /> : null}
                      </span>
                      {o.name}
                    </span>
                    <span className="tabular text-stone">+{formatMoney(o.priceDelta)}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        {item.ingredients.length > 0 ? (
          <fieldset>
            <legend className="mb-1 text-[13px] font-semibold text-charcoal">Орц</legend>
            <p className="mb-2 text-xs text-stone">Хэрэггүй орцоо сонгож хасуулна уу.</p>
            <div className="flex flex-wrap gap-1.5">
              {item.ingredients.map((ing) => {
                const off = removed.has(ing);
                return (
                  <button
                    key={ing}
                    type="button"
                    aria-pressed={off}
                    onClick={() => setRemoved((s) => toggle(s, ing))}
                    className={cn("rounded-full border px-3 py-1 text-[13px] transition-colors", off ? "border-danger/30 bg-danger-soft text-danger line-through" : "border-line bg-surface text-charcoal hover:border-line-strong")}
                  >
                    {ing}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        {orderingEnabled && item.isAvailable ? (
          <div>
            <label htmlFor="item-note" className="mb-1.5 block text-[13px] font-semibold text-charcoal">
              Тайлбар <span className="font-normal text-stone-light">(заавал биш)</span>
            </label>
            <Textarea id="item-note" rows={2} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Жишээ нь: халуун ногоогүй" />
          </div>
        ) : null}
      </div>

      <div className="sticky -bottom-5 -mx-5 -mb-5 flex items-center gap-3 border-t border-line bg-surface/95 px-5 py-3.5 backdrop-blur">
        {orderingEnabled && item.isAvailable ? (
          <>
            <div className="flex items-center rounded-md border border-line">
              <IconButton icon="minus" label="Тоо хасах" size="sm" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} />
              <span className="tabular w-8 text-center text-sm font-semibold" aria-live="polite">{qty}</span>
              <IconButton icon="plus" label="Тоо нэмэх" size="sm" onClick={() => setQty((q) => Math.min(50, q + 1))} />
            </div>
            <Button
              size="lg"
              className="flex-1 text-white hover:brightness-95"
              style={{ backgroundColor: accent }}
              onClick={(e) => {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                onAdd(
                  {
                    itemId: item.id,
                    name: item.name,
                    unitPrice: unit,
                    quantity: qty,
                    optionIds,
                    optionNames: picked.map((o) => o.name),
                    removed: [...removed],
                    note: note.trim() || undefined,
                    artKey: item.artKey,
                    imageUrl: item.imageUrl,
                  },
                  rect,
                );
                onClose();
              }}
            >
              Сагсанд нэмэх · {formatMoney(unit * qty)}
            </Button>
          </>
        ) : (
          <p className="flex-1 text-center text-sm font-medium text-stone">{item.isAvailable ? "Одоогоор онлайн захиалга хаалттай байна." : "Энэ бүтээгдэхүүн одоогоор дууссан байна."}</p>
        )}
      </div>
    </div>
  );
}
