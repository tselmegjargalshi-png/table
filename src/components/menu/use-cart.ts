"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type CartLine = {
  key: string;
  itemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  optionIds: string[];
  optionNames: string[];
  removed: string[];
  note?: string;
  artKey?: string | null;
  imageUrl?: string | null;
};

const storeKey = (slug: string) => `tablemn:cart:${slug}`;

function lineKey(l: Pick<CartLine, "itemId" | "optionIds" | "removed" | "note">) {
  return [l.itemId, [...l.optionIds].sort().join("."), [...l.removed].sort().join("."), l.note ?? ""].join("|");
}

export function useCart(slug: string) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storeKey(slug));
      // localStorage-ийг зөвхөн хөтөч дээр уншдаг тул hydration-ийн дараа нэг удаа state-д оруулна
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* хөтөч хадгалалт хориотой үед сагс зөвхөн хуудасны хугацаанд ажиллана */
    }
    setReady(true);
  }, [slug]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(storeKey(slug), JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines, ready, slug]);

  const add = useCallback((line: Omit<CartLine, "key">) => {
    const key = lineKey(line);
    setLines((cur) => {
      const found = cur.find((l) => l.key === key);
      if (found) return cur.map((l) => (l.key === key ? { ...l, quantity: Math.min(50, l.quantity + line.quantity) } : l));
      return [...cur, { ...line, key }];
    });
  }, []);

  const setQty = useCallback((key: string, quantity: number) => {
    setLines((cur) => (quantity <= 0 ? cur.filter((l) => l.key !== key) : cur.map((l) => (l.key === key ? { ...l, quantity: Math.min(50, quantity) } : l))));
  }, []);

  const clear = useCallback(() => setLines([]), []);
  const prune = useCallback((validItemIds: Set<string>) => setLines((cur) => cur.filter((l) => validItemIds.has(l.itemId))), []);

  const totals = useMemo(() => {
    const count = lines.reduce((s, l) => s + l.quantity, 0);
    const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    return { count, subtotal };
  }, [lines]);

  return { lines, ready, add, setQty, clear, prune, ...totals };
}
