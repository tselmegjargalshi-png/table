"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorNotice, Skeleton } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { api, ClientError } from "@/lib/client/fetcher";
import { formatDate, formatMoney, formatMoneyShort, formatPhone, formatRelative } from "@/lib/format";
import { ORDER_STATUS } from "@/lib/labels";
import type { CustomerDTO } from "@/server/services/customers";

type Sort = "spent" | "visits" | "recent" | "name";
type Stats = { total: number; returning: number; recent: number };
type Profile = {
  id: string; name: string; phone: string; email: string | null; notes: string | null; visits: number; totalSpent: number; avgOrder: number; lastVisitAt: string | null; createdAt: string; favorites: string[];
  orders: Array<{ id: string; number: number; status: keyof typeof ORDER_STATUS; total: number; createdAt: string; table: number | null; items: string[] }>;
};

export function CustomersClient({ initial, stats }: { initial: CustomerDTO[]; stats: Stats }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("spent");
  const [rows, setRows] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const first = useRef(true);

  async function load() {
    setLoading(true);
    try {
      setRows(await api<CustomerDTO[]>(`/api/staff/customers?q=${encodeURIComponent(q)}&sort=${sort}`));
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
    const t = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, sort]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          ["Нийт үйлчлүүлэгч", stats.total],
          ["Давтан ирсэн", stats.returning],
          ["Сүүлийн 30 хоногт", stats.recent],
        ].map(([l, v]) => (
          <div key={l} className="rounded-lg border border-line bg-surface p-3.5 sm:p-4">
            <p className="tabular text-2xl font-semibold">{v}</p>
            <p className="mt-0.5 text-xs text-stone sm:text-[13px]">{l}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-56 flex-1 sm:max-w-sm">
          <Input type="search" aria-label="Үйлчлүүлэгч хайх" placeholder="Нэр эсвэл утасны дугаараар хайх" value={q} onChange={(e) => setQ(e.target.value)} leading={<Icon name="search" size={16} />} />
        </div>
        <div className="w-52"><Select aria-label="Эрэмбэлэх" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="spent">Нийт зарцуулалтаар</option>
          <option value="visits">Зочилсон тоогоор</option>
          <option value="recent">Сүүлд ирсэнээр</option>
          <option value="name">Нэрээр</option>
        </Select></div>
        <Button icon="plus" className="ml-auto" onClick={() => setAddOpen(true)}>Үйлчлүүлэгч нэмэх</Button>
      </div>

      {error ? <ErrorNotice message={error} onRetry={() => void load()} /> : null}

      <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-soft" aria-busy={loading}>
        {rows.length === 0 && !loading ? (
          <EmptyState icon="users" title={q ? "Хайлтад тохирох үйлчлүүлэгч олдсонгүй" : "Үйлчлүүлэгч алга"} description="Захиалга өгөхдөө утасны дугаараа оруулсан үйлчлүүлэгч энд автоматаар бүртгэгдэнэ." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line bg-paper/60 text-left text-xs text-stone">
                  <th className="px-5 py-3 font-medium">Үйлчлүүлэгч</th>
                  <th className="px-3 py-3 font-medium">Утас</th>
                  <th className="px-3 py-3 text-right font-medium">Зочилсон</th>
                  <th className="px-3 py-3 text-right font-medium">Нийт зарцуулалт</th>
                  <th className="px-3 py-3 font-medium">Сүүлд ирсэн</th>
                  <th className="px-5 py-3 font-medium">Дуртай хоол</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loading && rows.length === 0 ? Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={6} className="px-5 py-3"><Skeleton className="h-6 w-full" /></td></tr>) : null}
                {rows.map((c) => (
                  <tr key={c.id} className="cursor-pointer transition-colors hover:bg-paper/70" onClick={() => setOpenId(c.id)}>
                    <td className="px-5 py-3">
                      <button className="flex items-center gap-3 text-left font-medium" onClick={(e) => { e.stopPropagation(); setOpenId(c.id); }}>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sand text-xs font-semibold text-charcoal">{c.name.slice(0, 1).toUpperCase()}</span>
                        {c.name}
                        {c.visits >= 10 ? <Badge tone="accent" size="sm">Тогтмол</Badge> : null}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-stone">{formatPhone(c.phone)}</td>
                    <td className="tabular px-3 py-3 text-right">{c.visits}</td>
                    <td className="tabular px-3 py-3 text-right font-medium">{formatMoney(c.totalSpent)}</td>
                    <td className="px-3 py-3 text-stone">{c.lastVisitAt ? formatRelative(c.lastVisitAt) : "Захиалгагүй"}</td>
                    <td className="px-5 py-3 text-stone">{c.favorites.join(", ") || "Мэдээлэл алга"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProfileModal id={openId} onClose={() => setOpenId(null)} onChanged={() => void load()} />
      <CustomerForm open={addOpen} onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); void load(); }} />
    </div>
  );
}

function ProfileModal({ id, onClose, onChanged }: { id: string | null; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const [p, setP] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setP(null);
    setError(null);
    api<Profile>(`/api/staff/customers/${id}`)
      .then((d) => {
        if (!alive) return;
        setP(d);
        setNotes(d.notes ?? "");
        setLoadedId(id);
      })
      .catch((e) => alive && setError((e as Error).message));
    return () => {
      alive = false;
    };
  }, [id]);

  async function saveNotes() {
    if (!p) return;
    setSaving(true);
    try {
      await api(`/api/staff/customers/${p.id}`, { method: "PUT", body: { name: p.name, phone: p.phone, email: p.email, notes } });
      toast.success("Тэмдэглэл хадгалагдлаа");
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={Boolean(id)} onClose={onClose} variant="sheet" title={p && loadedId === id ? p.name : "Үйлчлүүлэгч"} description={p ? formatPhone(p.phone) : undefined}>
      {error ? <ErrorNotice message={error} /> : !p || loadedId !== id ? (
        <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-32 w-full" /></div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl bg-ink p-5 text-paper">
            <p className="text-sm text-paper/60">{p.visits} удаа зочилсон</p>
            <p className="tabular mt-1 font-serif text-3xl tracking-tight">{formatMoney(p.totalSpent)}</p>
            <p className="mt-1 text-sm text-paper/60">нийт захиалга</p>
            <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-white/10 pt-4 text-sm">
              <div><dt className="text-xs text-paper/50">Дундаж захиалга</dt><dd className="tabular mt-0.5 font-medium">{formatMoneyShort(p.avgOrder)}</dd></div>
              <div><dt className="text-xs text-paper/50">Сүүлд ирсэн</dt><dd className="mt-0.5 font-medium">{p.lastVisitAt ? formatDate(p.lastVisitAt) : "Захиалгагүй"}</dd></div>
            </dl>
          </div>

          <section>
            <h3 className="mb-2 text-[13px] font-semibold">Дуртай хоол</h3>
            {p.favorites.length ? <div className="flex flex-wrap gap-2">{p.favorites.map((f) => <Badge key={f} tone="neutral">{f}</Badge>)}</div> : <p className="text-sm text-stone">Захиалгын түүх хараахан алга.</p>}
          </section>

          <section>
            <h3 className="mb-2 text-[13px] font-semibold">Тэмдэглэл</h3>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Жишээ нь: самрын харшилтай, цонхны дэргэд суух дуртай" maxLength={500} aria-label="Тэмдэглэл" />
            <div className="mt-2 flex justify-end"><Button size="sm" variant="secondary" loading={saving} onClick={() => void saveNotes()} disabled={notes === (p.notes ?? "")}>Хадгалах</Button></div>
          </section>

          <section>
            <h3 className="mb-2 text-[13px] font-semibold">Сүүлийн захиалгууд</h3>
            {p.orders.length === 0 ? <p className="text-sm text-stone">Захиалга алга.</p> : (
              <ul className="divide-y divide-line rounded-lg border border-line">
                {p.orders.map((o) => (
                  <li key={o.id} className="px-3.5 py-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="tabular font-medium">#{o.number}{o.table ? ` · Ширээ ${o.table}` : ""}</span>
                      <span className="tabular font-medium">{formatMoney(o.total)}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-stone">{o.items.join(", ")}</p>
                    <div className="mt-1.5 flex items-center justify-between text-xs text-stone"><span>{formatDate(o.createdAt)}</span><Badge tone={ORDER_STATUS[o.status].tone} size="sm">{ORDER_STATUS[o.status].label}</Badge></div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Modal>
  );
}

function CustomerForm({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  return (
    <Modal open={open} onClose={onClose} title="Үйлчлүүлэгч нэмэх" size="sm">
      <form
        noValidate
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          setFields({});
          try {
            await api("/api/staff/customers", { body: { name, phone, email: email || null } });
            toast.success("Үйлчлүүлэгч нэмэгдлээ");
            setName(""); setPhone(""); setEmail("");
            onSaved();
          } catch (err) {
            const ce = err as ClientError;
            setError(ce.message);
            setFields(ce.fields ?? {});
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="Нэр" error={fields.name}><Input value={name} onChange={(e) => setName(e.target.value)} data-autofocus /></Field>
        <Field label="Утасны дугаар" error={fields.phone}><Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="9911 2233" /></Field>
        <Field label="Имэйл" optional error={fields.email}><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        {error ? <ErrorNotice message={error} /> : null}
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Болих</Button><Button type="submit" loading={busy}>Нэмэх</Button></div>
      </form>
    </Modal>
  );
}
