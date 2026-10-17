"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/feedback";
import { Field, Input, MoneyInput, Select } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { api, ClientError } from "@/lib/client/fetcher";
import { cn } from "@/lib/cn";

type Cat = { id: string; name: string };
type Props = {
  userName: string;
  startStep: number;
  restaurant: { name: string; slug: string; address: string; phone: string; tagline: string; serviceFeePercent: number } | null;
  categories: Cat[];
  itemCount: number;
  tableCount: number;
};

const STEPS = ["Бүртгэл", "Ресторан", "Ангилал", "Бүтээгдэхүүн", "Ширээ", "QR код", "Бэлэн"];
const PRESET_CATEGORIES = ["Үндсэн хоол", "Шөл", "Зууш", "Салат", "Амттан", "Ундаа", "Кофе, цай"];

const CYR: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", ө: "u", п: "p", р: "r", с: "s", т: "t", у: "u", ү: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

function toSlug(name: string) {
  return name
    .toLowerCase()
    .split("")
    .map((c) => CYR[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

type Product = { key: number; categoryId: string; name: string; price: number };

export function OnboardingWizard({ userName, startStep, restaurant, categories: initialCats, itemCount, tableCount }: Props) {
  const [step, setStep] = useState(startStep);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  // 2. Ресторан
  const [name, setName] = useState(restaurant?.name ?? "");
  const [slugInput, setSlug] = useState(restaurant?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(restaurant));
  const [slugResult, setSlugResult] = useState<{ slug: string; available: boolean; message: string } | null>(null);
  const slug = slugTouched ? slugInput : toSlug(name);
  const slugState =
    step !== 2 || slug.length < 3
      ? null
      : restaurant && slug === restaurant.slug
        ? { available: true, message: "Боломжтой" }
        : slugResult?.slug === slug
          ? slugResult
          : null;
  const [address, setAddress] = useState(restaurant?.address ?? "");
  const [phone, setPhone] = useState(restaurant?.phone ?? "");
  const [tagline, setTagline] = useState(restaurant?.tagline ?? "");
  const [fee, setFee] = useState(restaurant?.serviceFeePercent ?? 0);

  // 3. Ангилал
  const [cats, setCats] = useState<Cat[]>(initialCats);
  const [picked, setPicked] = useState<string[]>(initialCats.length ? [] : ["Үндсэн хоол", "Ундаа"]);
  const [custom, setCustom] = useState("");

  // 4. Бүтээгдэхүүн
  const seq = useRef(1);
  const [products, setProducts] = useState<Product[]>(initialCats.length ? [{ key: 0, categoryId: initialCats[0].id, name: "", price: 0 }] : []);
  const [added, setAdded] = useState(itemCount);

  // 5. Ширээ
  const [tables, setTables] = useState(tableCount || 8);
  const [seats, setSeats] = useState(4);

  // 6. QR
  const [qr, setQr] = useState<{ url: string; svg: string } | null>(null);
  const [doneSlug, setDoneSlug] = useState(restaurant?.slug ?? "");

  useEffect(() => {
    if (step !== 2 || slug.length < 3 || (restaurant && slug === restaurant.slug)) return;
    const ctl = new AbortController();
    const t = setTimeout(() => {
      api<{ available: boolean; message: string }>(`/api/onboarding/slug?slug=${encodeURIComponent(slug)}`, { signal: ctl.signal })
        .then((r) => setSlugResult({ slug, ...r }))
        .catch(() => {});
    }, 350);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [slug, step, restaurant]);

  useEffect(() => {
    if (step === 6 && !qr) {
      api<{ url: string; svg: string }>("/api/onboarding/qr")
        .then(setQr)
        .catch((e: ClientError) => setError(e.message));
    }
  }, [step, qr]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setFields({});
    try {
      await fn();
    } catch (err) {
      const ce = err as ClientError;
      setError(ce.message);
      setFields(ce.fields ?? {});
    } finally {
      setBusy(false);
    }
  }

  const saveRestaurant = () =>
    run(async () => {
      const r = await api<{ slug: string }>("/api/onboarding/restaurant", {
        body: { name, slug, address: address || null, phone: phone || null, tagline: tagline || null, serviceFeePercent: fee },
      });
      setDoneSlug(r.slug);
      setStep(3);
    });

  const saveCategories = () =>
    run(async () => {
      const names = [...picked, ...(custom.trim() ? [custom.trim()] : [])];
      if (names.length === 0 && cats.length === 0) throw new ClientError("Хамгийн багадаа нэг ангилал сонгоно уу.", 422);
      const all = await api<Cat[]>("/api/onboarding/categories", { body: { categories: names.length ? names : cats.map((c) => c.name) } });
      setCats(all);
      setPicked([]);
      setCustom("");
      setProducts((p) => (p.length ? p : [{ key: seq.current++, categoryId: all[0].id, name: "", price: 0 }]));
      setStep(4);
    });

  const saveProducts = () =>
    run(async () => {
      const filled = products.filter((p) => p.name.trim());
      if (filled.length === 0 && added === 0) throw new ClientError("Хамгийн багадаа нэг бүтээгдэхүүн нэмнэ үү.", 422);
      if (filled.length) {
        await api("/api/onboarding/products", { body: { products: filled.map((p) => ({ categoryId: p.categoryId, name: p.name, price: p.price })) } });
        setAdded((a) => a + filled.length);
        setProducts([]);
      }
      setStep(5);
    });

  const saveTables = () =>
    run(async () => {
      await api("/api/onboarding/tables", { body: { count: tables, seats } });
      setStep(6);
    });

  const finish = () =>
    run(async () => {
      const r = await api<{ slug: string }>("/api/onboarding/complete", { body: {} });
      setDoneSlug(r.slug);
      setStep(7);
    });

  const emptyProduct = (): Product => ({ key: seq.current++, categoryId: cats[0]?.id ?? "", name: "", price: 0 });
  const productsToShow = products.length ? products : [];
  const catCountLeft = picked.length + (custom.trim() ? 1 : 0);

  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Link href="/" aria-label="TABLE.MN нүүр хуудас">
            <Logo />
          </Link>
          <p className="text-sm text-stone">{userName}</p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
        <nav aria-label="Алхам" className="mb-10">
          <ol className="flex items-center gap-1.5 sm:gap-2">
            {STEPS.map((label, i) => {
              const n = i + 1;
              const state = n < step ? "done" : n === step ? "current" : "todo";
              return (
                <li key={label} className="flex min-w-0 flex-1 flex-col gap-2" aria-current={state === "current" ? "step" : undefined}>
                  <span className={cn("h-1 rounded-full transition-colors", state === "todo" ? "bg-line" : "bg-ink")} />
                  <span className={cn("hidden truncate text-xs sm:block", state === "current" ? "font-medium text-ink" : "text-stone")}>
                    {n}. {label}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 text-xs text-stone sm:hidden">
            {step}/7 · {STEPS[step - 1]}
          </p>
        </nav>

        {step === 2 && (
          <Section title="Рестораныхаа мэдээллийг оруулна уу" lead="Эдгээр мэдээлэл таны цахим меню дээр харагдана.">
            <form
              className="grid gap-4 sm:grid-cols-2"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void saveRestaurant();
              }}
            >
              <Field label="Рестораны нэр" error={fields.name} className="sm:col-span-2">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Жишээ нь: Хотын бууз" data-autofocus />
              </Field>
              <Field
                label="Меню холбоос"
                className="sm:col-span-2"
                error={fields.slug ?? (slugState && !slugState.available ? slugState.message : undefined)}
                hint={
                  slugState?.available ? (
                    <span className="text-success">Боломжтой: {slug}.table.mn</span>
                  ) : (
                    "Латин үсэг, тоо, зураас ашиглана. Үйлчлүүлэгчид энэ холбоосоор орно."
                  )
                }
              >
                <Input
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value.toLowerCase());
                  }}
                  placeholder="hotyn-buuz"
                  autoCapitalize="none"
                  spellCheck={false}
                />
              </Field>
              <Field label="Товч уриа" optional error={fields.tagline} className="sm:col-span-2">
                <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Жишээ нь: Гар хийцийн бууз, хуушуур" />
              </Field>
              <Field label="Хаяг" optional error={fields.address}>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} />
              </Field>
              <Field label="Утас" optional error={fields.phone}>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>
              <Field label="Үйлчилгээний хураамж" hint="Ширээн дээрх захиалгад нэмэгдэнэ. Байхгүй бол 0." error={fields.serviceFeePercent}>
                <Input type="number" min={0} max={30} value={fee} onChange={(e) => setFee(Math.min(30, Math.max(0, Math.round(Number(e.target.value) || 0))))} trailing="%" />
              </Field>
              <Footer error={error} className="sm:col-span-2">
                <Button type="submit" size="lg" iconRight="arrowRight" loading={busy} disabled={name.trim().length < 2 || slug.length < 3 || slugState?.available === false}>
                  Үргэлжлүүлэх
                </Button>
              </Footer>
            </form>
          </Section>
        )}

        {step === 3 && (
          <Section title="Менюгийн ангилал үүсгэе" lead="Хоолоо бүлэглэх ангиллуудыг сонгоно уу. Дараа нь өөрчилж болно.">
            {cats.length > 0 && (
              <div className="mb-5">
                <p className="mb-2 text-[13px] font-medium text-charcoal">Үүссэн ангилал</p>
                <div className="flex flex-wrap gap-2">
                  {cats.map((c) => (
                    <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-sand px-3 py-1.5 text-sm">
                      <Icon name="check" size={14} className="text-success" />
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <p className="mb-2 text-[13px] font-medium text-charcoal">Санал болгох ангилал</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Санал болгох ангилал">
              {PRESET_CATEGORIES.filter((p) => !cats.some((c) => c.name.toLowerCase() === p.toLowerCase())).map((p) => {
                const on = picked.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setPicked((s) => (on ? s.filter((x) => x !== p) : [...s, p]))}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors",
                      on ? "border-ink bg-ink text-paper" : "border-line bg-surface hover:border-line-strong",
                    )}
                  >
                    {on ? <Icon name="check" size={14} /> : <Icon name="plus" size={14} className="text-stone" />}
                    {p}
                  </button>
                );
              })}
            </div>
            <form
              className="mt-5 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const v = custom.trim();
                if (v && !picked.includes(v)) setPicked((s) => [...s, v]);
                setCustom("");
              }}
            >
              <Input aria-label="Өөр ангилал нэмэх" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Өөр ангилалын нэр" maxLength={40} />
              <Button type="submit" variant="secondary" icon="plus" disabled={!custom.trim()}>
                Нэмэх
              </Button>
            </form>
            {picked.filter((p) => !PRESET_CATEGORIES.includes(p)).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {picked
                  .filter((p) => !PRESET_CATEGORIES.includes(p))
                  .map((p) => (
                    <span key={p} className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-sm text-paper">
                      {p}
                      <button type="button" aria-label={`${p} ангиллыг хасах`} onClick={() => setPicked((s) => s.filter((x) => x !== p))}>
                        <Icon name="x" size={14} />
                      </button>
                    </span>
                  ))}
              </div>
            )}
            <Footer error={error} back={() => setStep(2)}>
              <Button size="lg" iconRight="arrowRight" loading={busy} disabled={catCountLeft === 0 && cats.length === 0} onClick={saveCategories}>
                Үргэлжлүүлэх
              </Button>
            </Footer>
          </Section>
        )}

        {step === 4 && (
          <Section title="Эхний хоолоо нэмье" lead="Хамгийн багадаа нэг бүтээгдэхүүн нэмнэ. Зураг, тайлбар, нэмэлтийг дараа нь меню удирдлагаас нэмж болно.">
            {added > 0 && <p className="mb-4 rounded-md border border-success/20 bg-success-soft px-3 py-2 text-sm text-success">Одоогоор {added} бүтээгдэхүүн нэмэгдсэн байна.</p>}
            <div className="space-y-3">
              {productsToShow.map((p, i) => (
                <div key={p.key} className="grid gap-2 rounded-lg border border-line bg-surface p-3 sm:grid-cols-[1fr_9rem_1fr_auto] sm:items-end">
                  <Field label={i === 0 ? "Хоолны нэр" : "Нэр"}>
                    <Input value={p.name} onChange={(e) => setProducts((s) => s.map((x) => (x.key === p.key ? { ...x, name: e.target.value } : x)))} placeholder="Жишээ нь: Бууз" />
                  </Field>
                  <Field label="Үнэ">
                    <MoneyInput value={p.price} onChange={(v) => setProducts((s) => s.map((x) => (x.key === p.key ? { ...x, price: v } : x)))} />
                  </Field>
                  <Field label="Ангилал">
                    <Select value={p.categoryId} onChange={(e) => setProducts((s) => s.map((x) => (x.key === p.key ? { ...x, categoryId: e.target.value } : x)))}>
                      {cats.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Button variant="ghost" size="md" icon="trash" aria-label="Мөр устгах" className="justify-self-end" onClick={() => setProducts((s) => s.filter((x) => x.key !== p.key))} />
                </div>
              ))}
            </div>
            <Button variant="secondary" icon="plus" className="mt-3" onClick={() => setProducts((s) => [...s, emptyProduct()])}>
              Бүтээгдэхүүн нэмэх
            </Button>
            <Footer error={error} back={() => setStep(3)}>
              <Button size="lg" iconRight="arrowRight" loading={busy} onClick={saveProducts}>
                Үргэлжлүүлэх
              </Button>
            </Footer>
          </Section>
        )}

        {step === 5 && (
          <Section title="Ширээгээ тохируулъя" lead="Ширээ бүрт өөрийн QR код үүснэ. Байрлалыг дараа нь «Ширээ» хэсгээс чөлөөтэй зохион байгуулна.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ширээний тоо" hint={tableCount ? `Одоо ${tableCount} ширээ байна. Тоог нэмэгдүүлбэл дутууг нэмнэ.` : "Хэрэв ширээгүй бол 0 гэж оруулна."}>
                <Input type="number" min={0} max={120} value={tables} onChange={(e) => setTables(Math.min(120, Math.max(0, Math.round(Number(e.target.value) || 0))))} />
              </Field>
              <Field label="Нэг ширээний суудал">
                <Input type="number" min={1} max={20} value={seats} onChange={(e) => setSeats(Math.min(20, Math.max(1, Math.round(Number(e.target.value) || 1))))} />
              </Field>
            </div>
            <MiniFloor count={Math.min(tables, 24)} />
            <Footer error={error} back={() => setStep(4)}>
              <Button size="lg" iconRight="arrowRight" loading={busy} onClick={saveTables}>
                Үргэлжлүүлэх
              </Button>
            </Footer>
          </Section>
        )}

        {step === 6 && (
          <Section title="QR кодоо татаж аваарай" lead="Энэ код таны цахим меню руу шууд оруулна. Ширээ бүрийн QR кодыг «QR код» хэсгээс хэвлэнэ.">
            <div className="flex flex-col items-center gap-4 rounded-xl border border-line bg-surface p-8 sm:flex-row sm:items-center sm:gap-8">
              <div className="grid h-48 w-48 shrink-0 place-items-center rounded-lg bg-white p-2 ring-1 ring-line">
                {qr ? <div className="h-full w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr.svg }} role="img" aria-label="Рестораны меню QR код" /> : <Spinner />}
              </div>
              <div className="min-w-0 text-center sm:text-left">
                <p className="text-sm text-stone">Меню холбоос</p>
                <p className="mt-1 break-all font-mono text-sm">{qr?.url ?? "..."}</p>
                {qr && (
                  <a href={qr.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4">
                    Меню нээж үзэх <Icon name="external" size={14} />
                  </a>
                )}
              </div>
            </div>
            <Footer error={error} back={() => setStep(5)}>
              <Button size="lg" iconRight="arrowRight" loading={busy} onClick={finish} disabled={!qr}>
                Дуусгах
              </Button>
            </Footer>
          </Section>
        )}

        {step === 7 && (
          <div className="py-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success-soft text-success">
              <Icon name="check" size={26} />
            </span>
            <h1 className="mt-6 font-serif text-4xl tracking-[-0.02em]">Таны меню бэлэн боллоо.</h1>
            <p className="mx-auto mt-3 max-w-md text-stone">Одоо QR кодоо ширээн дээрээ байрлуулж, захиалга хүлээн авч эхэлж болно.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/app" size="lg" iconRight="arrowRight">
                Хянах самбар руу очих
              </ButtonLink>
              <ButtonLink href={`/r/${doneSlug}`} variant="secondary" size="lg" target="_blank" icon="external">
                Меню үзэх
              </ButtonLink>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, lead, children }: { title: string; lead: string; children: React.ReactNode }) {
  return (
    <section>
      <h1 className="font-serif text-3xl tracking-[-0.02em] sm:text-4xl">{title}</h1>
      <p className="mb-8 mt-2 max-w-xl text-stone">{lead}</p>
      {children}
    </section>
  );
}

function Footer({ children, error, back, className }: { children: React.ReactNode; error: string | null; back?: () => void; className?: string }) {
  return (
    <div className={cn("mt-8 space-y-4", className)}>
      {error ? <ErrorNotice message={error} /> : null}
      <div className="flex items-center justify-between gap-3">
        {back ? (
          <Button variant="ghost" icon="arrowLeft" onClick={back}>
            Буцах
          </Button>
        ) : (
          <span />
        )}
        {children}
      </div>
    </div>
  );
}

function MiniFloor({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div className="mt-6 rounded-xl border border-line bg-sand p-5" aria-hidden="true">
      <div className="grid grid-cols-6 gap-3 sm:grid-cols-8">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="grid aspect-square place-items-center rounded-md border border-line-strong bg-surface font-mono text-xs text-charcoal shadow-[0_2px_0_var(--color-line-strong)]">
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}
