"use client";

import { useRef, useState } from "react";
import { ART_KEYS } from "@/components/menu/dish-art";
import { MenuImage } from "@/components/menu/menu-image";
import { Button, IconButton } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/feedback";
import { Field, Input, MoneyInput, Select, Textarea } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { api, ClientError } from "@/lib/client/fetcher";
import type { StaffCategory, StaffItem } from "@/lib/staff-menu-types";

type OptionDraft = { key: number; kind: "OPTION" | "ADDON"; groupName: string; name: string; priceDelta: number; isDefault: boolean };

let optionKeySeq = 0;
const nextOptionKey = () => ++optionKeySeq;

export function ItemEditor({ value, categories, defaultCategoryId, onClose, onSaved }: { value: StaffItem | "new" | null; categories: StaffCategory[]; defaultCategoryId?: string; onClose: () => void; onSaved: () => void | Promise<void> }) {
  const editing = value && value !== "new" ? value : null;
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [artKey, setArtKey] = useState<string>("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingInput, setIngInput] = useState("");
  const [isAvailable, setAvailable] = useState(true);
  const [isPopular, setPopular] = useState(false);
  const [isFeatured, setFeatured] = useState(false);
  const [prep, setPrep] = useState("10");
  const [options, setOptions] = useState<OptionDraft[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [openKey, setOpenKey] = useState<string | null>(null);

  const k = value === null ? null : editing ? editing.id : "new";
  if (k !== openKey) {
    setOpenKey(k);
    setCategoryId(editing?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? "");
    setName(editing?.name ?? "");
    setDescription(editing?.description ?? "");
    setPrice(editing?.price ?? 0);
    setImageUrl(editing?.imageUrl ?? null);
    setArtKey(editing?.artKey ?? "");
    setIngredients(editing?.ingredients ?? []);
    setIngInput("");
    setAvailable(editing?.isAvailable ?? true);
    setPopular(editing?.isPopular ?? false);
    setFeatured(editing?.isFeatured ?? false);
    setPrep(String(editing?.prepMinutes ?? 10));
    setOptions((editing?.options ?? []).map((o) => ({ key: nextOptionKey(), kind: o.kind, groupName: o.groupName ?? "", name: o.name, priceDelta: o.priceDelta, isDefault: o.isDefault })));
    setError(null);
    setFields({});
  }

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api<{ url: string }>("/api/staff/images", { body: fd });
      setImageUrl(res.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function addIngredient() {
    const v = ingInput.trim();
    if (v && !ingredients.includes(v) && ingredients.length < 20) setIngredients([...ingredients, v]);
    setIngInput("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFields({});
    try {
      const body = {
        categoryId,
        name,
        description: description || null,
        price,
        imageUrl,
        artKey: artKey || null,
        ingredients,
        isAvailable,
        isPopular,
        isFeatured,
        prepMinutes: Number(prep) || 10,
        options: options.filter((o) => o.name.trim()).map((o) => ({ kind: o.kind, groupName: o.kind === "OPTION" ? o.groupName.trim() || "Сонголт" : null, name: o.name.trim(), priceDelta: o.priceDelta, isDefault: o.kind === "OPTION" && o.isDefault })),
      };
      if (editing) await api(`/api/staff/menu/items/${editing.id}`, { method: "PUT", body });
      else await api("/api/staff/menu/items", { body });
      toast.success(editing ? "Бүтээгдэхүүн шинэчлэгдлээ" : "Бүтээгдэхүүн нэмэгдлээ");
      await onSaved();
    } catch (err) {
      const ce = err as ClientError;
      setError(ce.message);
      setFields(ce.fields ?? {});
    } finally {
      setBusy(false);
    }
  }

  const upd = (key: number, patch: Partial<OptionDraft>) => setOptions((list) => list.map((o) => (o.key === key ? { ...o, ...patch } : o)));

  return (
    <Modal open={value !== null} onClose={onClose} title={editing ? "Бүтээгдэхүүн засах" : "Шинэ бүтээгдэхүүн"} size="lg">
      <form onSubmit={save} className="space-y-6" noValidate>
        <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
          <div>
            <div className="aspect-square overflow-hidden rounded-lg border border-line bg-sand">
              <MenuImage imageUrl={imageUrl} artKey={artKey || null} name={name || "Зураг"} />
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} aria-label="Зураг сонгох" />
            <div className="mt-2 flex gap-2">
              <Button variant="secondary" size="sm" icon="upload" className="flex-1" loading={uploading} onClick={() => fileRef.current?.click()}>Зураг оруулах</Button>
              {imageUrl ? <IconButton icon="trash" label="Зургийг устгах" size="sm" variant="danger" onClick={() => setImageUrl(null)} /> : null}
            </div>
            {!imageUrl ? (
              <div className="mt-3">
                <Field label="Зураггүй үеийн дүрс">
                  <Select value={artKey} onChange={(e) => setArtKey(e.target.value)}>
                    <option value="">Автомат</option>
                    {ART_KEYS.map(([k2, label]) => <option key={k2} value={k2}>{label}</option>)}
                  </Select>
                </Field>
              </div>
            ) : null}
          </div>
          <div className="space-y-4">
            <Field label="Нэр" error={fields.name}><Input value={name} onChange={(e) => setName(e.target.value)} data-autofocus /></Field>
            <Field label="Товч тайлбар" optional error={fields.description}><Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Үнэ" error={fields.price}><MoneyInput value={price} onChange={setPrice} /></Field>
              <Field label="Ангилал" error={fields.categoryId}>
                <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Бэлтгэх хугацаа (минут)"><Input inputMode="numeric" value={prep} onChange={(e) => setPrep(e.target.value.replace(/\D/g, ""))} className="max-w-32" /></Field>
          </div>
        </div>

        <section>
          <h3 className="text-[13px] font-semibold">Орц</h3>
          <p className="mb-2 text-xs text-stone">Үйлчлүүлэгч хэрэггүй орцоо хасуулж болно.</p>
          <div className="flex flex-wrap gap-1.5">
            {ingredients.map((i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full border border-line bg-sand py-1 pl-3 pr-1.5 text-[13px]">
                {i}
                <button type="button" aria-label={`${i} орцыг хасах`} onClick={() => setIngredients(ingredients.filter((x) => x !== i))} className="rounded-full p-0.5 text-stone hover:bg-beige hover:text-ink"><Icon name="x" size={12} /></button>
              </span>
            ))}
            <input value={ingInput} onChange={(e) => setIngInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addIngredient(); } }} onBlur={addIngredient} placeholder="Орц нэмэх, Enter дарна" aria-label="Орц нэмэх" className="min-w-40 flex-1 rounded-full border border-dashed border-line-strong bg-transparent px-3 py-1 text-[13px] outline-none focus:border-ink" />
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-semibold">Сонголт ба нэмэлт</h3>
              <p className="text-xs text-stone">Сонголт: нэг бүлгээс нэгийг сонгоно (жишээ нь хэмжээ). Нэмэлт: хүссэнээ нэмнэ.</p>
            </div>
            <Button variant="secondary" size="sm" icon="plus" onClick={() => setOptions([...options, { key: nextOptionKey(), kind: "OPTION", groupName: "", name: "", priceDelta: 0, isDefault: options.length === 0 }])}>Нэмэх</Button>
          </div>
          {options.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line-strong px-4 py-5 text-center text-sm text-stone">Сонголт, нэмэлт алга</p>
          ) : (
            <ul className="space-y-2">
              {options.map((o) => (
                <li key={o.key} className="grid grid-cols-[110px_1fr_auto] items-end gap-2 rounded-lg border border-line p-2.5 sm:grid-cols-[120px_130px_1fr_130px_auto_auto]">
                  <Field label="Төрөл"><Select value={o.kind} onChange={(e) => upd(o.key, { kind: e.target.value as OptionDraft["kind"] })} className="h-9 text-[13px]"><option value="OPTION">Сонголт</option><option value="ADDON">Нэмэлт</option></Select></Field>
                  {o.kind === "OPTION" ? <Field label="Бүлэг" className="max-sm:hidden"><Input value={o.groupName} onChange={(e) => upd(o.key, { groupName: e.target.value })} placeholder="Хэмжээ" className="h-9 text-[13px]" /></Field> : <span className="max-sm:hidden" />}
                  <Field label="Нэр"><Input value={o.name} onChange={(e) => upd(o.key, { name: e.target.value })} className="h-9 text-[13px]" /></Field>
                  <Field label="Нэмэх үнэ" className="max-sm:col-span-2"><MoneyInput value={o.priceDelta} onChange={(v) => upd(o.key, { priceDelta: v })} className="h-9 text-[13px]" /></Field>
                  {o.kind === "OPTION" ? (
                    <label className="flex h-9 items-center gap-1.5 text-xs text-stone max-sm:col-span-2"><input type="checkbox" checked={o.isDefault} onChange={(e) => upd(o.key, { isDefault: e.target.checked })} className="accent-ember" />Үндсэн</label>
                  ) : <span className="max-sm:hidden" />}
                  <IconButton icon="trash" label="Сонголтыг устгах" size="sm" onClick={() => setOptions(options.filter((x) => x.key !== o.key))} />
                </li>
              ))}
            </ul>
          )}
          {fields["options"] ? <p className="mt-1 text-xs text-danger">{fields["options"]}</p> : null}
        </section>

        <section className="grid gap-3 rounded-lg bg-sand/60 p-4 sm:grid-cols-3">
          <Switch checked={isAvailable} onChange={setAvailable} label="Зарагдаж байгаа" description="Унтраавал «Дууссан» гэж харагдана." />
          <Switch checked={isPopular} onChange={setPopular} label="Эрэлттэй" description="Тэмдэг харагдана." />
          <Switch checked={isFeatured} onChange={setFeatured} label="Онцлох" description="Менюны эхэнд гарна." />
        </section>

        {error ? <ErrorNotice message={error} /> : null}
        <div className="sticky -bottom-5 -mx-5 flex justify-end gap-2 border-t border-line bg-surface/95 px-5 py-3 backdrop-blur">
          <Button variant="ghost" onClick={onClose}>Болих</Button>
          <Button type="submit" loading={busy || uploading}>{editing ? "Хадгалах" : "Нэмэх"}</Button>
        </div>
      </form>
    </Modal>
  );
}
