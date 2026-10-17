"use client";

import { Reorder, useDragControls } from "motion/react";
import { useCallback, useState } from "react";
import { MenuImage } from "@/components/menu/menu-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dropdown } from "@/components/ui/dropdown";
import { EmptyState, ErrorNotice } from "@/components/ui/feedback";
import { Field, Input, MoneyInput } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { api } from "@/lib/client/fetcher";
import { formatMoney } from "@/lib/format";
import { toStaffCategories, type StaffCategory, type StaffItem } from "@/lib/staff-menu-types";
import { menuUrl } from "@/lib/urls";
import { ItemEditor } from "./item-editor";

export function MenuManager({ initial, canEdit, slug }: { initial: StaffCategory[]; canEdit: boolean; slug: string }) {
  const toast = useToast();
  const [cats, setCats] = useState(initial);
  const [activeId, setActiveId] = useState(initial[0]?.id ?? "");
  const [editItem, setEditItem] = useState<StaffItem | "new" | null>(null);
  const [catForm, setCatForm] = useState<StaffCategory | "new" | null>(null);
  const [deleting, setDeleting] = useState<{ type: "item" | "cat"; id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const raw = await api<Parameters<typeof toStaffCategories>[0]>("/api/staff/menu");
      setCats(toStaffCategories(raw));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const active = cats.find((c) => c.id === activeId) ?? cats[0];

  async function patch(item: StaffItem, data: Partial<Pick<StaffItem, "price" | "isAvailable" | "isPopular">>) {
    setCats((list) => list.map((c) => ({ ...c, items: c.items.map((i) => (i.id === item.id ? { ...i, ...data } : i)) })));
    try {
      await api(`/api/staff/menu/items/${item.id}`, { method: "PATCH", body: data });
      if (data.isAvailable !== undefined) toast.success(data.isAvailable ? `${item.name}: зарагдаж байна` : `${item.name}: дууссан гэж тэмдэглэлээ`);
    } catch (e) {
      toast.error((e as Error).message);
      void reload();
    }
  }

  async function reorderItems(catId: string, items: StaffItem[]) {
    setCats((list) => list.map((c) => (c.id === catId ? { ...c, items } : c)));
  }
  async function commitItems(items: StaffItem[]) {
    try {
      await api("/api/staff/menu/items/reorder", { body: { ids: items.map((i) => i.id) } });
    } catch (e) {
      toast.error((e as Error).message);
      void reload();
    }
  }
  async function commitCats(next: StaffCategory[]) {
    try {
      await api("/api/staff/menu/categories/reorder", { body: { ids: next.map((c) => c.id) } });
    } catch (e) {
      toast.error((e as Error).message);
      void reload();
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await api(deleting.type === "item" ? `/api/staff/menu/items/${deleting.id}` : `/api/staff/menu/categories/${deleting.id}`, { method: "DELETE" });
      toast.success(`${deleting.name} устгагдлаа`);
      if (deleting.type === "cat" && activeId === deleting.id) setActiveId("");
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeleting(null);
    }
  }

  const moveItem = (idx: number, dir: -1 | 1) => {
    if (!active) return;
    const items = [...active.items];
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    [items[idx], items[j]] = [items[j], items[idx]];
    void reorderItems(active.id, items);
    void commitItems(items);
  };

  return (
    <div className="space-y-4">
      {error ? <ErrorNotice message={error} onRetry={() => void reload()} /> : null}
      {!canEdit ? <p className="rounded-md border border-line bg-sand px-3 py-2 text-[13px] text-charcoal">Та зөвхөн бүтээгдэхүүний үлдэгдэл, «Зарагдаж байгаа» төлвийг өөрчилж болно.</p> : null}

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="h-fit lg:sticky lg:top-6">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-[15px] font-semibold">Ангилал</h2>
            {canEdit ? <Button size="xs" variant="secondary" icon="plus" onClick={() => setCatForm("new")}>Нэмэх</Button> : null}
          </div>
          {cats.length === 0 ? (
            <EmptyState icon="book" title="Ангилал алга" description="Эхлээд ангилал үүсгэнэ үү." className="py-8" />
          ) : (
            <Reorder.Group axis="y" values={cats} onReorder={setCats} className="p-2 max-lg:flex max-lg:gap-2 max-lg:overflow-x-auto max-lg:scrollbar-none">
              {cats.map((c) => (
                <CategoryRow key={c.id} cat={c} active={c.id === active?.id} canEdit={canEdit} onSelect={() => setActiveId(c.id)} onDragEnd={() => void commitCats(cats)} onEdit={() => setCatForm(c)} onDelete={() => setDeleting({ type: "cat", id: c.id, name: c.name })} />
              ))}
            </Reorder.Group>
          )}
        </Card>

        <div>
          {active ? (
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                <div>
                  <h2 className="font-serif text-xl">{active.name}</h2>
                  <p className="text-[13px] text-stone">{active.items.length} бүтээгдэхүүн{!active.isVisible ? " · Үйлчлүүлэгчид харагдахгүй" : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a href={menuUrl(slug)} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-sm px-3 text-[13px] font-medium text-charcoal hover:bg-sand"><Icon name="eye" size={14} />Үйлчлүүлэгчийн харагдац</a>
                  {canEdit ? <Button size="sm" icon="plus" onClick={() => setEditItem("new")}>Бүтээгдэхүүн нэмэх</Button> : null}
                </div>
              </div>
              {active.items.length === 0 ? (
                <EmptyState icon="book" title="Энэ ангилалд бүтээгдэхүүн алга" description="Эхний бүтээгдэхүүнээ нэмж менюгээ бүрдүүлээрэй." action={canEdit ? <Button icon="plus" onClick={() => setEditItem("new")}>Бүтээгдэхүүн нэмэх</Button> : undefined} />
              ) : (
                <Reorder.Group axis="y" values={active.items} onReorder={(items) => void reorderItems(active.id, items)} className="divide-y divide-line">
                  {active.items.map((item, idx) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      canEdit={canEdit}
                      first={idx === 0}
                      last={idx === active.items.length - 1}
                      onDragEnd={() => void commitItems(active.items)}
                      onPatch={(d) => void patch(item, d)}
                      onEdit={() => setEditItem(item)}
                      onDelete={() => setDeleting({ type: "item", id: item.id, name: item.name })}
                      onMove={(d) => moveItem(idx, d)}
                    />
                  ))}
                </Reorder.Group>
              )}
            </Card>
          ) : (
            <Card><EmptyState icon="book" title="Ангилал сонгоно уу" /></Card>
          )}
        </div>
      </div>

      <ItemEditor
        value={editItem}
        categories={cats}
        defaultCategoryId={active?.id}
        onClose={() => setEditItem(null)}
        onSaved={async () => {
          setEditItem(null);
          await reload();
        }}
      />
      <CategoryForm
        value={catForm}
        onClose={() => setCatForm(null)}
        onSaved={async (id) => {
          setCatForm(null);
          await reload();
          if (id) setActiveId(id);
        }}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
        danger
        title={`«${deleting?.name ?? ""}»-г устгах уу?`}
        description={deleting?.type === "cat" ? "Ангилалд бүтээгдэхүүн байхгүй үед л устгана." : "Өмнөх захиалгын түүх хэвээр хадгалагдана."}
        confirmLabel="Устгах"
      />
    </div>
  );
}

function CategoryRow({ cat, active, canEdit, onSelect, onDragEnd, onEdit, onDelete }: { cat: StaffCategory; active: boolean; canEdit: boolean; onSelect: () => void; onDragEnd: () => void; onEdit: () => void; onDelete: () => void }) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={cat} dragListener={false} dragControls={controls} onDragEnd={onDragEnd} className="list-none max-lg:shrink-0" whileDrag={{ scale: 1.02, boxShadow: "0 12px 28px rgb(22 21 19 / 0.15)" }}>
      <div className={cn("group flex items-center gap-1 rounded-md pr-1 transition-colors", active ? "bg-sand" : "hover:bg-sand/60")}>
        {canEdit ? (
          <span onPointerDown={(e) => controls.start(e)} className="hidden cursor-grab touch-none px-1.5 py-2.5 text-stone-light active:cursor-grabbing lg:block" aria-hidden="true"><Icon name="grip" size={16} /></span>
        ) : null}
        <button onClick={onSelect} aria-current={active} className="flex min-w-0 flex-1 items-center gap-2 py-2 pl-2 text-left text-sm font-medium lg:pl-0">
          <span className="truncate">{cat.name}</span>
          <span className="tabular text-xs text-stone-light">{cat.items.length}</span>
          {!cat.isVisible ? <Icon name="eye" size={13} className="text-stone-light" /> : null}
        </button>
        {canEdit ? (
          <Dropdown label={`${cat.name} цэс`} trigger={() => <span className="flex h-7 w-7 items-center justify-center rounded text-stone hover:bg-beige"><Icon name="more" size={16} /></span>} items={[{ label: "Засах", icon: "edit", onSelect: onEdit }, { label: "Устгах", icon: "trash", onSelect: onDelete, danger: true }]} />
        ) : null}
      </div>
    </Reorder.Item>
  );
}

function ItemRow({ item, canEdit, first, last, onDragEnd, onPatch, onEdit, onDelete, onMove }: { item: StaffItem; canEdit: boolean; first: boolean; last: boolean; onDragEnd: () => void; onPatch: (d: Partial<Pick<StaffItem, "price" | "isAvailable" | "isPopular">>) => void; onEdit: () => void; onDelete: () => void; onMove: (d: -1 | 1) => void }) {
  const controls = useDragControls();
  const [price, setPrice] = useState<number | null>(null);
  return (
    <Reorder.Item value={item} dragListener={false} dragControls={controls} onDragEnd={onDragEnd} className="list-none bg-surface" whileDrag={{ boxShadow: "0 12px 28px rgb(22 21 19 / 0.15)", zIndex: 10 }}>
      <div className={cn("flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4", !item.isAvailable && "bg-paper/70")}>
        {canEdit ? <span onPointerDown={(e) => controls.start(e)} className="hidden cursor-grab touch-none text-stone-light active:cursor-grabbing sm:block" aria-hidden="true"><Icon name="grip" size={18} /></span> : null}
        <button onClick={canEdit ? onEdit : undefined} className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-sand" aria-label={`${item.name} засах`} tabIndex={canEdit ? 0 : -1}>
          <MenuImage imageUrl={item.imageUrl} artKey={item.artKey} name={item.name} />
        </button>
        <div className="min-w-0 flex-1">
          <p className={cn("flex flex-wrap items-center gap-2 text-sm font-semibold", !item.isAvailable && "text-stone")}>
            <span className="truncate">{item.name}</span>
            {item.isPopular ? <Badge tone="accent" size="sm">Эрэлттэй</Badge> : null}
            {item.options.length > 0 ? <Badge tone="muted" size="sm">{item.options.length} сонголт</Badge> : null}
          </p>
          <p className="mt-0.5 line-clamp-1 text-xs text-stone">{item.description ?? "Тайлбаргүй"}</p>
        </div>
        {canEdit ? (
          <div className="hidden w-32 sm:block">
            <MoneyInput aria-label={`${item.name} үнэ`} value={price ?? item.price} onChange={setPrice} onBlur={() => { if (price !== null && price !== item.price) onPatch({ price }); setPrice(null); }} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} className="h-9 text-right tabular" />
          </div>
        ) : (
          <p className="tabular hidden text-sm font-semibold sm:block">{formatMoney(item.price)}</p>
        )}
        <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-3">
          <p className="tabular text-sm font-semibold sm:hidden">{formatMoney(item.price)}</p>
          <Switch size="sm" hideLabel checked={item.isAvailable} onChange={(v) => onPatch({ isAvailable: v })} label={`${item.name}: зарагдаж байгаа`} />
          <span className="hidden w-[104px] text-xs text-stone lg:block">{item.isAvailable ? "Зарагдаж байгаа" : "Дууссан"}</span>
        </div>
        {canEdit ? (
          <Dropdown
            label={`${item.name} цэс`}
            trigger={() => <span className="flex h-8 w-8 items-center justify-center rounded text-stone hover:bg-sand"><Icon name="more" size={18} /></span>}
            items={[
              { label: "Засах", icon: "edit", onSelect: onEdit },
              { label: item.isPopular ? "Эрэлттэй тэмдэг авах" : "Эрэлттэй гэж тэмдэглэх", icon: "star", onSelect: () => onPatch({ isPopular: !item.isPopular }) },
              { label: "Дээш зөөх", icon: "chevronUp", onSelect: () => onMove(-1), disabled: first },
              { label: "Доош зөөх", icon: "chevronDown", onSelect: () => onMove(1), disabled: last },
              { label: "Устгах", icon: "trash", onSelect: onDelete, danger: true },
            ]}
          />
        ) : null}
      </div>
    </Reorder.Item>
  );
}

function CategoryForm({ value, onClose, onSaved }: { value: StaffCategory | "new" | null; onClose: () => void; onSaved: (id?: string) => void }) {
  const editing = value && value !== "new" ? value : null;
  const toast = useToast();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [visible, setVisible] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState<string | null>(null);
  const k = value === null ? null : editing ? editing.id : "new";
  if (k !== key) {
    setKey(k);
    setName(editing?.name ?? "");
    setDesc(editing?.description ?? "");
    setVisible(editing?.isVisible ?? true);
    setError(null);
  }
  return (
    <Modal open={value !== null} onClose={onClose} title={editing ? "Ангилал засах" : "Шинэ ангилал"} size="sm">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            const body = { name, description: desc || null, isVisible: visible };
            const res = editing ? await api<{ id: string }>(`/api/staff/menu/categories/${editing.id}`, { method: "PUT", body }) : await api<{ id: string }>("/api/staff/menu/categories", { body });
            toast.success(editing ? "Ангилал шинэчлэгдлээ" : "Ангилал нэмэгдлээ");
            onSaved(res.id);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="Ангиллын нэр"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Жишээ нь: Амттан" data-autofocus /></Field>
        <Field label="Тайлбар" optional><Input value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
        <Switch checked={visible} onChange={setVisible} label="Үйлчлүүлэгчид харагдах" description="Унтраавал ангилал менюнээс түр нуугдана." />
        {error ? <ErrorNotice message={error} /> : null}
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Болих</Button><Button type="submit" loading={busy}>Хадгалах</Button></div>
      </form>
    </Modal>
  );
}
