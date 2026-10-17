import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MenuClient } from "@/components/menu/menu-client";
import { toPublicMenuDTO } from "@/lib/menu-types";
import { menuUrl } from "@/lib/urls";
import { getPublicMenu } from "@/server/services/menu";
import { trackScan } from "@/server/services/qr";
import { db } from "@/lib/db";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ t?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = await db.restaurant.findUnique({ where: { slug }, select: { name: true, tagline: true, description: true, address: true } });
  if (!r) return { title: "Ресторан олдсонгүй" };
  const description = r.tagline ?? r.description ?? `${r.name} рестораны цахим меню. QR-аар захиалж, ширээгээ урьдчилан захиалаарай.`;
  return {
    title: `${r.name} | Цахим меню`,
    description,
    alternates: { canonical: menuUrl(slug) },
    openGraph: { title: `${r.name} | Цахим меню`, description, type: "website", locale: "mn_MN", url: menuUrl(slug) },
    twitter: { card: "summary_large_image", title: `${r.name} | Цахим меню`, description },
  };
}

export default async function RestaurantMenuPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { t } = await searchParams;
  const menu = await getPublicMenu(slug);
  if (!menu) notFound();

  let table: { number: number; code: string } | null = null;
  if (t && /^[a-z0-9]{4,16}$/i.test(t)) {
    const qr = await trackScan(menu.id, t);
    if (qr?.table && qr.type === "TABLE") table = { number: qr.table.number, code: qr.code };
  }

  const dto = toPublicMenuDTO(menu);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: menu.name,
    description: menu.tagline ?? undefined,
    address: menu.address ?? undefined,
    telephone: menu.phone ?? undefined,
    url: menuUrl(slug),
    hasMenu: {
      "@type": "Menu",
      hasMenuSection: dto.categories.map((c) => ({
        "@type": "MenuSection",
        name: c.name,
        hasMenuItem: c.items.slice(0, 20).map((i) => ({ "@type": "MenuItem", name: i.name, description: i.description ?? undefined, offers: { "@type": "Offer", price: i.price, priceCurrency: "MNT" } })),
      })),
    },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <MenuClient menu={dto} table={table} />
    </>
  );
}
