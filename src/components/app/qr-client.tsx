"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/modal";
import { Dropdown } from "@/components/ui/dropdown";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client/fetcher";
import type { QrDTO } from "@/server/services/qr";
import { ButtonLink } from "@/components/ui/button";

function download(name: string, blob: Blob) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function svgToPng(svg: string, size = 1024): Promise<Blob> {
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error("QR кодыг зураг болгож чадсангүй."));
    img.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(img, 0, 0, size, size);
  URL.revokeObjectURL(url);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Алдаа"))), "image/png"));
}

export function QrClient({ codes, canManage, restaurantName }: { codes: QrDTO[]; canManage: boolean; restaurantName: string }) {
  const toast = useToast();
  const [regen, setRegen] = useState<QrDTO | null>(null);
  const label = (c: QrDTO) => (c.type === "RESTAURANT" ? "Рестораны QR" : `Ширээ ${c.table?.number}`);
  const slugName = restaurantName.toLowerCase().replace(/[^a-z0-9а-яөү]+/gi, "-");

  async function copy(c: QrDTO) {
    try {
      await navigator.clipboard.writeText(c.url);
      toast.success("Холбоос хууллаа");
    } catch {
      toast.error("Хуулж чадсангүй. Холбоосыг гараар сонгож хуулна уу.");
    }
  }

  async function png(c: QrDTO) {
    try {
      download(`${slugName}-${c.type === "RESTAURANT" ? "restaurant" : `table-${c.table?.number}`}.png`, await svgToPng(c.svg));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-stone">Ширээ бүр өөрийн QR кодтой. Үйлчлүүлэгч уншуулмагц ширээний дугаар автоматаар таарч, захиалга шууд тухайн ширээнд очино.</p>
        <ButtonLink href="/app/qr/print" target="_blank" icon="printer">Хэвлэх хуудас</ButtonLink>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {codes.map((c) => (
          <li key={c.id}>
            <Card className="flex h-full flex-col p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{label(c)}</p>
                {canManage ? (
                  <Dropdown label={`${label(c)} цэс`} trigger={() => <span className="flex h-8 w-8 items-center justify-center rounded text-stone hover:bg-sand"><Icon name="more" size={18} /></span>} items={[{ label: "Кодыг шинэчлэх", icon: "refresh", onSelect: () => setRegen(c) }]} />
                ) : null}
              </div>
              <div className="mx-auto my-4 w-full max-w-[200px] rounded-lg border border-line bg-white p-2.5 [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: c.svg }} role="img" aria-label={`${label(c)} QR код`} />
              <p className="break-all text-center text-xs text-stone">{c.url.replace(/^https?:\/\//, "")}</p>
              <div className="mt-2 flex justify-center gap-2 text-xs text-stone-light">
                {c.table ? <Badge tone="muted" size="sm">{c.table.seats} суудал</Badge> : <Badge tone="muted" size="sm">Бүх ширээнд</Badge>}
                <Badge tone="muted" size="sm">{c.scans} удаа уншсан</Badge>
              </div>
              <div className="mt-auto grid grid-cols-3 gap-2 pt-4">
                <Button size="sm" variant="secondary" icon="copy" onClick={() => void copy(c)}>Хуулах</Button>
                <Button size="sm" variant="secondary" icon="download" onClick={() => void png(c)}>PNG</Button>
                <Button size="sm" variant="secondary" icon="download" onClick={() => download(`${slugName}-${c.type === "RESTAURANT" ? "restaurant" : `table-${c.table?.number}`}.svg`, new Blob([c.svg], { type: "image/svg+xml" }))}>SVG</Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={Boolean(regen)}
        onClose={() => setRegen(null)}
        danger
        title={`${regen ? label(regen) : ""} кодыг шинэчлэх үү?`}
        description="Хуучин хэвлэсэн QR код ажиллахаа болино. Шинэ кодыг дахин хэвлэх шаардлагатай."
        confirmLabel="Шинэчлэх"
        onConfirm={async () => {
          if (!regen) return;
          try {
            await api(`/api/staff/qr/${regen.id}`, { body: {} });
            toast.success("QR код шинэчлэгдлээ");
            window.location.reload();
          } catch (e) {
            toast.error((e as Error).message);
          }
          setRegen(null);
        }}
      />
    </div>
  );
}
