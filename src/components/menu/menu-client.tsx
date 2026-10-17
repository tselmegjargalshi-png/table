"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RestaurantMark } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import type { MenuItemDTO, PublicMenuDTO } from "@/lib/menu-types";
import { CartPanel } from "./cart-panel";
import { ItemSheet } from "./item-sheet";
import { MenuImage } from "./menu-image";
import { ReservationForm } from "./reservation-form";
import { useCart, type CartLine } from "./use-cart";

type Fly = { id: number; from: DOMRect; art: { imageUrl: string | null; artKey: string | null; name: string } };

export function MenuClient({ menu, table }: { menu: PublicMenuDTO; table: { number: number; code: string } | null }) {
  const { restaurant, categories, featured } = menu;
  const accent = restaurant.brandColor;
  const cart = useCart(restaurant.slug);
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>(featured.length ? "featured" : categories[0]?.id ?? "");
  const [sheetItem, setSheetItem] = useState<MenuItemDTO | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [flies, setFlies] = useState<Fly[]>([]);
  const [bump, setBump] = useState(0);
  const barRef = useRef<HTMLButtonElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const clickScroll = useRef(false);
  const orderingEnabled = restaurant.acceptingOrders && (restaurant.allowDineIn || restaurant.allowTakeaway || restaurant.allowDelivery);

  // Менюнээс устсан бүтээгдэхүүнийг сагснаас цэвэрлэнэ
  const validIds = useMemo(() => new Set(categories.flatMap((c) => c.items.map((i) => i.id))), [categories]);
  useEffect(() => {
    if (cart.ready) cart.prune(validIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.ready, validIds]);

  const searching = query.trim().length > 0;
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return categories.flatMap((c) => c.items).filter((i) => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
  }, [categories, query]);

  // Гүйлгэх үед идэвхтэй ангиллыг тодруулна
  useEffect(() => {
    if (searching) return;
    const ids = [...(featured.length ? ["featured"] : []), ...categories.map((c) => c.id)];
    const obs = new IntersectionObserver(
      (entries) => {
        if (clickScroll.current) return;
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id.replace("sec-", ""));
      },
      { rootMargin: "-140px 0px -65% 0px", threshold: 0 },
    );
    for (const id of ids) {
      const el = document.getElementById(`sec-${id}`);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [categories, featured.length, searching]);

  useEffect(() => {
    const chip = chipsRef.current?.querySelector<HTMLElement>(`[data-chip="${active}"]`);
    chip?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active]);

  const goTo = (id: string) => {
    setActive(id);
    clickScroll.current = true;
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    window.setTimeout(() => (clickScroll.current = false), 700);
  };

  const addLine = useCallback(
    (line: Omit<CartLine, "key">, source: DOMRect | null) => {
      cart.add(line);
      setBump((b) => b + 1);
      if (source && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setFlies((f) => [...f, { id: Date.now() + Math.random(), from: source, art: { imageUrl: line.imageUrl ?? null, artKey: line.artKey ?? null, name: line.name } }]);
      }
      toast.success(`${line.name} сагсанд нэмэгдлээ`);
    },
    [cart, toast],
  );

  const quickAdd = (item: MenuItemDTO, el: HTMLElement) => {
    const hasChoices = item.options.length > 0 || item.ingredients.length > 0;
    if (hasChoices) {
      setSheetItem(item);
      return;
    }
    addLine(
      { itemId: item.id, name: item.name, unitPrice: item.price, quantity: 1, optionIds: [], optionNames: [], removed: [], artKey: item.artKey, imageUrl: item.imageUrl },
      el.getBoundingClientRect(),
    );
  };

  const cartPanel = (onDone?: () => void) => (
    <CartPanel restaurant={restaurant} lines={cart.lines} setQty={cart.setQty} clear={cart.clear} table={table} onDone={onDone} />
  );

  return (
    <div className="min-h-dvh bg-paper pb-28 lg:pb-12">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 pb-5 pt-6 sm:px-6">
          <div className="flex items-start gap-4">
            <RestaurantMark name={restaurant.name} text={restaurant.logoText} color={accent} size={56} />
            <div className="min-w-0 flex-1">
              <h1 className="font-serif text-[26px] leading-tight tracking-[-0.02em] sm:text-3xl">{restaurant.name}</h1>
              {restaurant.tagline ? <p className="mt-0.5 text-sm text-stone">{restaurant.tagline}</p> : null}
            </div>
            {table ? (
              <Badge tone="neutral" className="shrink-0 !px-2.5 !py-1 !text-[13px]">
                <Icon name="seat" size={14} />
                Ширээ {table.number}
              </Badge>
            ) : null}
          </div>
          <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-stone">
            {restaurant.address ? (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Хаяг</dt>
                <Icon name="pin" size={15} />
                <dd>{restaurant.address}</dd>
              </div>
            ) : null}
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Нээлттэй цаг</dt>
              <Icon name="clock" size={15} />
              <dd className="flex items-center gap-2">
                {restaurant.hoursToday ?? "Өнөөдөр амарна"}
                <Badge tone={restaurant.openNow ? "success" : "muted"} dot size="sm">
                  {restaurant.openNow ? "Нээлттэй" : "Хаалттай"}
                </Badge>
              </dd>
            </div>
            {restaurant.phone ? (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Утас</dt>
                <Icon name="phone" size={15} />
                <dd>
                  <a href={`tel:${restaurant.phone.replace(/\s/g, "")}`} className="hover:text-ink">
                    {restaurant.phone}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
          {restaurant.isDemo ? (
            <p className="mt-4 rounded-md border border-warning/25 bg-warning-soft px-3 py-2 text-xs text-warning">
              Энэ бол TABLE.MN системийн туршилтын (зохиомол) ресторан. Захиалгууд бодит биш.
            </p>
          ) : null}
          {!orderingEnabled ? (
            <p className="mt-4 rounded-md border border-line bg-sand px-3 py-2 text-[13px] text-charcoal">Ресторан одоогоор онлайн захиалга хүлээн авахгүй байна. Та менюг үзэх боломжтой.</p>
          ) : null}
        </div>

        <div className="sticky top-0 z-30 border-t border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
          <div className="mx-auto max-w-6xl px-4 pt-3 sm:px-6">
            <Input
              type="search"
              aria-label="Меню хайх"
              placeholder="Хоол, ундаа хайх"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leading={<Icon name="search" size={16} />}
              className="bg-paper"
            />
          </div>
          {!searching ? (
            <div ref={chipsRef} className="mx-auto mt-2 flex max-w-6xl gap-1.5 overflow-x-auto px-4 pb-3 scrollbar-none sm:px-6" role="tablist" aria-label="Ангилал">
              {featured.length ? <Chip id="featured" label="Онцлох" active={active === "featured"} onClick={goTo} accent={accent} /> : null}
              {categories.map((c) => (
                <Chip key={c.id} id={c.id} label={c.name} active={active === c.id} onClick={goTo} accent={accent} />
              ))}
            </div>
          ) : (
            <div className="h-3" />
          )}
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-8 px-4 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <main className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            {searching ? (
              <motion.section key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} aria-live="polite">
                <p className="mb-3 text-sm text-stone">«{query.trim()}» гэж хайсан {results.length} үр дүн</p>
                {results.length ? (
                  <ul className="grid gap-3">
                    {results.map((i) => (
                      <ItemRow key={i.id} item={i} onOpen={() => setSheetItem(i)} onQuick={quickAdd} accent={accent} orderingEnabled={orderingEnabled} />
                    ))}
                  </ul>
                ) : (
                  <EmptyState icon="search" title="Илэрц олдсонгүй" description="Өөр үгээр хайж үзнэ үү эсвэл ангилалаас сонгоно уу." action={<Button variant="secondary" onClick={() => setQuery("")}>Хайлтыг цэвэрлэх</Button>} />
                )}
              </motion.section>
            ) : (
              <motion.div key="browse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-10">
                {featured.length ? (
                  <section id="sec-featured" className="scroll-mt-36" aria-labelledby="h-featured">
                    <h2 id="h-featured" className="mb-3 font-serif text-xl tracking-[-0.01em]">Онцлох</h2>
                    <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 scrollbar-none sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
                      {featured.map((i) => (
                        <FeaturedCard key={i.id} item={i} onOpen={() => setSheetItem(i)} />
                      ))}
                    </div>
                  </section>
                ) : null}
                {categories.map((c) => (
                  <section key={c.id} id={`sec-${c.id}`} className="scroll-mt-36" aria-labelledby={`h-${c.id}`}>
                    <h2 id={`h-${c.id}`} className="font-serif text-xl tracking-[-0.01em]">{c.name}</h2>
                    {c.description ? <p className="mt-0.5 text-sm text-stone">{c.description}</p> : null}
                    <ul className="mt-3 grid gap-3">
                      {c.items.map((i) => (
                        <ItemRow key={i.id} item={i} onOpen={() => setSheetItem(i)} onQuick={quickAdd} accent={accent} orderingEnabled={orderingEnabled} />
                      ))}
                    </ul>
                  </section>
                ))}
                {categories.length === 0 ? <EmptyState icon="book" title="Меню хоосон байна" description="Ресторан удахгүй менюгээ нэмнэ." /> : null}
              </motion.div>
            )}
          </AnimatePresence>

          <section className="mt-12 rounded-lg border border-line bg-surface p-5">
            <h2 className="font-serif text-lg">Ширээ захиалах</h2>
            <p className="mt-1 text-sm text-stone">Ирэх өдөр, цагаа сонгоод урьдчилан ширээ захиалаарай.</p>
            <Button className="mt-4" variant="secondary" icon="calendar" onClick={() => setReserveOpen(true)}>
              Ширээ захиалах
            </Button>
          </section>

          <footer className="mt-10 text-center text-xs text-stone-light">
            <Link href="/" className="hover:text-stone">TABLE.MN</Link> системээр ажилладаг
          </footer>
        </main>

        <aside className="hidden lg:block" aria-label="Сагс">
          <div className="sticky top-6 max-h-[calc(100dvh-3rem)] overflow-hidden rounded-lg border border-line bg-surface p-5 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-lg">Сагс</h2>
              {cart.count > 0 ? <span className="tabular text-sm text-stone">{cart.count} ширхэг</span> : null}
            </div>
            <div className="flex max-h-[calc(100dvh-9rem)] flex-col overflow-hidden">{cartPanel()}</div>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {cart.count > 0 ? (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
            className="fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
          >
            <motion.button
              ref={barRef}
              key={bump}
              animate={{ scale: [1, 1.025, 1] }}
              transition={{ duration: 0.3 }}
              onClick={() => setCartOpen(true)}
              className="mx-auto flex h-14 w-full max-w-xl items-center justify-between rounded-lg px-4 text-white shadow-float"
              style={{ backgroundColor: accent }}
              aria-label={`Сагс нээх, ${cart.count} ширхэг, ${formatMoney(cart.subtotal)}`}
            >
              <span className="flex items-center gap-3">
                <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/18">
                  <Icon name="bag" size={18} />
                  <span className="tabular absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold" style={{ color: accent }}>
                    {cart.count}
                  </span>
                </span>
                <span className="text-[15px] font-semibold">Сагс харах</span>
              </span>
              <span className="tabular text-[15px] font-semibold">{formatMoney(cart.subtotal)}</span>
            </motion.button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {flies.map((f) => (
        <FlyDot key={f.id} fly={f} target={() => barRef.current?.getBoundingClientRect() ?? null} accent={accent} onDone={() => setFlies((l) => l.filter((x) => x.id !== f.id))} />
      ))}

      <ItemSheet item={sheetItem} open={Boolean(sheetItem)} onClose={() => setSheetItem(null)} onAdd={addLine} accent={accent} orderingEnabled={orderingEnabled} />

      <Modal open={cartOpen} onClose={() => setCartOpen(false)} title="Сагс" variant="sheet" size="md">
        <div className="flex min-h-[50dvh] flex-col sm:min-h-0">{cartPanel(() => setCartOpen(false))}</div>
      </Modal>

      <Modal open={reserveOpen} onClose={() => setReserveOpen(false)} title="Ширээ захиалах" description={restaurant.name}>
        <ReservationForm slug={restaurant.slug} onDone={() => setReserveOpen(false)} />
      </Modal>
    </div>
  );
}

function Chip({ id, label, active, onClick, accent }: { id: string; label: string; active: boolean; onClick: (id: string) => void; accent: string }) {
  return (
    <button
      data-chip={id}
      role="tab"
      aria-selected={active}
      onClick={() => onClick(id)}
      className={cn("relative shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors", active ? "text-white" : "text-charcoal hover:bg-sand")}
    >
      {active ? <motion.span layoutId="chip-active" className="absolute inset-0 rounded-full" style={{ backgroundColor: accent }} transition={{ type: "spring", bounce: 0.18, duration: 0.4 }} /> : null}
      <span className="relative">{label}</span>
    </button>
  );
}

function FeaturedCard({ item, onOpen }: { item: MenuItemDTO; onOpen: () => void }) {
  return (
    <button onClick={onOpen} disabled={false} className="group w-44 shrink-0 snap-start text-left sm:w-52" aria-label={`${item.name}, ${formatMoney(item.price)}`}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-line bg-sand">
        <div className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-105">
          <MenuImage imageUrl={item.imageUrl} artKey={item.artKey} name={item.name} />
        </div>
        {!item.isAvailable ? <div className="absolute inset-0 flex items-center justify-center bg-paper/75 text-xs font-semibold text-stone">Дууссан</div> : null}
      </div>
      <p className="mt-2 text-sm font-medium leading-snug">{item.name}</p>
      <p className="tabular text-[13px] text-stone">{formatMoney(item.price)}</p>
    </button>
  );
}

function ItemRow({ item, onOpen, onQuick, accent, orderingEnabled }: { item: MenuItemDTO; onOpen: () => void; onQuick: (item: MenuItemDTO, el: HTMLElement) => void; accent: string; orderingEnabled: boolean }) {
  const soldOut = !item.isAvailable;
  return (
    <li>
      <div className={cn("group flex gap-3.5 rounded-lg border border-line bg-surface p-3 transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-soft", soldOut && "opacity-70")}>
        <button onClick={onOpen} className="flex min-w-0 flex-1 flex-col text-left" aria-label={`${item.name} дэлгэрэнгүй`}>
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-semibold leading-snug">{item.name}</span>
            {item.isPopular ? <Badge tone="accent" size="sm">Эрэлттэй</Badge> : null}
          </span>
          {item.description ? <span className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-stone">{item.description}</span> : null}
          <span className="mt-auto pt-2">
            <span className="tabular text-[15px] font-semibold">{formatMoney(item.price)}</span>
            {soldOut ? <span className="ml-2 text-xs font-medium text-danger">Дууссан</span> : null}
          </span>
        </button>
        <div className="relative h-[104px] w-[104px] shrink-0 sm:h-[116px] sm:w-[116px]">
          <button onClick={onOpen} tabIndex={-1} aria-hidden="true" className="block h-full w-full overflow-hidden rounded-md bg-sand">
            <MenuImage imageUrl={item.imageUrl} artKey={item.artKey} name={item.name} />
          </button>
          {orderingEnabled && !soldOut ? (
            <button
              onClick={(e) => onQuick(item, e.currentTarget)}
              aria-label={`${item.name} сагсанд нэмэх`}
              className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-surface text-white shadow-raised transition-transform active:scale-90"
              style={{ backgroundColor: accent }}
            >
              <Icon name="plus" size={18} strokeWidth={2.2} />
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function FlyDot({ fly, target, accent, onDone }: { fly: Fly; target: () => DOMRect | null; accent: string; onDone: () => void }) {
  const to = target() ?? new DOMRect(window.innerWidth / 2, window.innerHeight - 50, 0, 0);
  const startX = fly.from.left + fly.from.width / 2;
  const startY = fly.from.top + fly.from.height / 2;
  const endX = to.left + 36;
  const endY = to.top + to.height / 2;
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[60] h-9 w-9 overflow-hidden rounded-full border-2 border-white shadow-raised"
      style={{ backgroundColor: accent }}
      initial={{ x: startX - 18, y: startY - 18, scale: 1, opacity: 1 }}
      animate={{ x: endX - 18, y: endY - 18, scale: 0.4, opacity: 0.2 }}
      transition={{ duration: 0.65, ease: [0.5, 0, 0.2, 1] }}
      onAnimationComplete={onDone}
    >
      <MenuImage imageUrl={fly.art.imageUrl} artKey={fly.art.artKey} name="" />
    </motion.div>
  );
}
