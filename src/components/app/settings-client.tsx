"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ErrorNotice } from "@/components/ui/feedback";
import { Field, Input, MoneyInput, Textarea } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RestaurantMark } from "@/components/brand/logo";
import { useToast } from "@/components/ui/toast";
import { api, ClientError } from "@/lib/client/fetcher";
import { STAFF_ROLE } from "@/lib/labels";
import { menuUrl } from "@/lib/urls";
import type { StaffRole } from "@prisma/client";

export type SettingsDTO = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  address: string;
  district: string;
  phone: string;
  email: string;
  brandColor: string;
  serviceFeePercent: number;
  deliveryFee: number;
  allowDineIn: boolean;
  allowTakeaway: boolean;
  allowDelivery: boolean;
  acceptingOrders: boolean;
  openingHours: { day: number; open: string; close: string; closed: boolean }[];
  logoText: string | null;
};

export type StaffRow = { id: string; name: string; email: string; role: StaffRole };

const DAYS = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const SWATCHES = ["#B4532A", "#1F5F4A", "#2B4C7E", "#7A2E3A", "#5B3F8C", "#161513"];

export function SettingsClient({ initial, staff, canEdit }: { initial: SettingsDTO; staff: StaffRow[]; canEdit: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [s, setS] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const dirty = JSON.stringify(s) !== JSON.stringify(initial);

  const set = <K extends keyof SettingsDTO>(k: K, v: SettingsDTO[K]) => setS((p) => ({ ...p, [k]: v }));
  const setDay = (day: number, patch: Partial<SettingsDTO["openingHours"][number]>) =>
    set(
      "openingHours",
      s.openingHours.map((h) => (h.day === day ? { ...h, ...patch } : h)),
    );

  async function save() {
    setSaving(true);
    setError(null);
    setFields({});
    try {
      await api("/api/staff/settings", {
        method: "PUT",
        body: {
          name: s.name,
          tagline: s.tagline || null,
          description: s.description || null,
          address: s.address || null,
          district: s.district || null,
          phone: s.phone || null,
          email: s.email || null,
          brandColor: s.brandColor,
          serviceFeePercent: s.serviceFeePercent,
          deliveryFee: s.deliveryFee,
          allowDineIn: s.allowDineIn,
          allowTakeaway: s.allowTakeaway,
          allowDelivery: s.allowDelivery,
          acceptingOrders: s.acceptingOrders,
          openingHours: s.openingHours,
        },
      });
      toast.success("Тохиргоо хадгалагдлаа");
      router.refresh();
    } catch (err) {
      const ce = err as ClientError;
      setError(ce.message);
      setFields(ce.fields ?? {});
    } finally {
      setSaving(false);
    }
  }

  const ro = !canEdit;

  return (
    <div className="grid gap-6 pb-24 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        {ro ? <p className="rounded-md border border-line bg-sand px-3 py-2 text-sm text-stone">Тохиргоог зөвхөн эзэмшигч болон менежер өөрчилнө.</p> : null}

        <Card className="p-5">
          <CardHeader title="Рестораны мэдээлэл" description="Үйлчлүүлэгчид меню дээр харах мэдээлэл." />
          <fieldset disabled={ro} className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Рестораны нэр" error={fields.name} className="sm:col-span-2">
              <Input value={s.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Товч уриа" optional error={fields.tagline} className="sm:col-span-2">
              <Input value={s.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="Жишээ нь: Гар хийцийн бууз, хуушуур" />
            </Field>
            <Field label="Тайлбар" optional error={fields.description} className="sm:col-span-2">
              <Textarea value={s.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <Field label="Хаяг" optional error={fields.address}>
              <Input value={s.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <Field label="Дүүрэг" optional error={fields.district}>
              <Input value={s.district} onChange={(e) => set("district", e.target.value)} />
            </Field>
            <Field label="Утас" optional error={fields.phone}>
              <Input type="tel" value={s.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Имэйл" optional error={fields.email}>
              <Input type="email" value={s.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
          </fieldset>
        </Card>

        <Card className="p-5">
          <CardHeader title="Захиалгын тохиргоо" description="Ямар төрлийн захиалга хүлээн авахаа сонгоно." />
          <fieldset disabled={ro} className="mt-5 space-y-4">
            <Switch checked={s.acceptingOrders} onChange={(v) => set("acceptingOrders", v)} label="Онлайн захиалга хүлээн авч байна" description="Унтраавал меню харагдана, гэхдээ захиалга өгөх боломжгүй болно." />
            <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-3">
              <Switch checked={s.allowDineIn} onChange={(v) => set("allowDineIn", v)} label="Ширээн дээрээс" />
              <Switch checked={s.allowTakeaway} onChange={(v) => set("allowTakeaway", v)} label="Аваад явах" />
              <Switch checked={s.allowDelivery} onChange={(v) => set("allowDelivery", v)} label="Хүргэлт" />
            </div>
            <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
              <Field label="Үйлчилгээний хураамж" hint="Ширээн дээрх захиалгын дүнгээс авах хувь." error={fields.serviceFeePercent}>
                <Input
                  type="number"
                  min={0}
                  max={30}
                  value={s.serviceFeePercent}
                  onChange={(e) => set("serviceFeePercent", Math.min(30, Math.max(0, Math.round(Number(e.target.value) || 0))))}
                  trailing="%"
                />
              </Field>
              <Field label="Хүргэлтийн төлбөр" error={fields.deliveryFee}>
                <MoneyInput value={s.deliveryFee} onChange={(v) => set("deliveryFee", v)} />
              </Field>
            </div>
          </fieldset>
        </Card>

        <Card className="p-5">
          <CardHeader title="Ажлын цаг" description="Меню дээр нээлттэй эсэхийг энэ цагаар тооцно." />
          <fieldset disabled={ro} className="mt-4 divide-y divide-line">
            {DAY_ORDER.map((d) => {
              const h = s.openingHours.find((x) => x.day === d)!;
              return (
                <div key={d} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                  <span className="w-20 text-sm font-medium">{DAYS[d]}</span>
                  <Switch size="sm" hideLabel checked={!h.closed} onChange={(v) => setDay(d, { closed: !v })} label={`${DAYS[d]} гарагт нээлттэй`} />
                  {h.closed ? (
                    <span className="text-sm text-stone">Амарна</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input type="time" aria-label={`${DAYS[d]} нээх цаг`} className="w-28" value={h.open} onChange={(e) => setDay(d, { open: e.target.value })} />
                      <span className="text-stone">-</span>
                      <Input type="time" aria-label={`${DAYS[d]} хаах цаг`} className="w-28" value={h.close} onChange={(e) => setDay(d, { close: e.target.value })} />
                    </div>
                  )}
                </div>
              );
            })}
          </fieldset>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="p-5">
          <CardHeader title="Брэндийн өнгө" description="Меню болон захиалгын хуудсан дээр ашиглагдана." />
          <div className="mt-4 flex items-center gap-3">
            <RestaurantMark name={s.name} text={s.logoText} color={s.brandColor} size={52} />
            <div className="min-w-0">
              <p className="truncate font-medium">{s.name || "Ресторан"}</p>
              <p className="font-mono text-xs text-stone">{s.brandColor.toUpperCase()}</p>
            </div>
          </div>
          <fieldset disabled={ro} className="mt-4">
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Брэндийн өнгө сонгох">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={s.brandColor.toLowerCase() === c.toLowerCase()}
                  aria-label={c}
                  onClick={() => set("brandColor", c)}
                  className="h-8 w-8 rounded-full ring-offset-2 ring-offset-surface transition aria-checked:ring-2 aria-checked:ring-ink"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <Field label="Өнгөний код" className="mt-4" error={fields.brandColor}>
              <Input value={s.brandColor} onChange={(e) => set("brandColor", e.target.value)} placeholder="#B4532A" maxLength={7} />
            </Field>
          </fieldset>
        </Card>

        <Card className="p-5">
          <CardHeader title="Меню холбоос" />
          <p className="mt-3 break-all rounded-md bg-sand px-3 py-2 font-mono text-xs">{menuUrl(s.slug)}</p>
          <a href={`/r/${s.slug}`} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-medium underline underline-offset-4">
            Меню нээж үзэх
          </a>
        </Card>

        <Card className="p-5">
          <CardHeader title="Ажилтнууд" description="Энэ ресторанд хандах эрхтэй хүмүүс." />
          <ul className="mt-3 divide-y divide-line">
            {staff.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="truncate text-xs text-stone">{m.email}</p>
                </div>
                <Badge tone={m.role === "OWNER" ? "accent" : "neutral"}>{STAFF_ROLE[m.role]}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {canEdit ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur-sm lg:left-[var(--sidebar-w,16rem)]">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div className="min-w-0 text-sm">{error ? <ErrorNotice message={error} /> : <span className="text-stone">{dirty ? "Хадгалаагүй өөрчлөлт байна." : "Бүх өөрчлөлт хадгалагдсан."}</span>}</div>
            <div className="flex shrink-0 gap-2">
              <Button variant="secondary" disabled={!dirty || saving} onClick={() => setS(initial)}>
                Болих
              </Button>
              <Button loading={saving} disabled={!dirty} onClick={save}>
                Хадгалах
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
