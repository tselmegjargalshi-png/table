import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getStaffContext } from "@/lib/auth/guard";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDateTime, formatMoney } from "@/lib/format";
import { ORDER_STATUS, ORDER_TYPE } from "@/lib/labels";

export const metadata: Metadata = { title: "Миний бүртгэл", robots: { index: false, follow: false } };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  const staff = await getStaffContext();
  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { restaurant: { select: { name: true, slug: true } }, items: { select: { quantity: true } } },
  });

  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Link href="/" aria-label="TABLE.MN нүүр хуудас">
            <Logo />
          </Link>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="font-serif text-3xl tracking-[-0.02em]">Сайн байна уу, {user.name}</h1>
        <p className="mt-1 text-sm text-stone">{user.email}</p>

        {staff ? (
          <Card className="mt-6 flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm">Та «{staff.restaurant.name}» рестораны ажилтан байна.</p>
            <ButtonLink href="/app" size="sm" iconRight="arrowRight">
              Хянах самбар
            </ButtonLink>
          </Card>
        ) : null}

        <h2 className="mb-3 mt-10 text-sm font-medium uppercase tracking-[0.08em] text-stone">Захиалгын түүх</h2>
        {orders.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="font-medium">Одоогоор захиалга байхгүй байна</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-stone">Нэвтэрсэн үедээ ресторанд өгсөн захиалгууд энд хадгалагдана.</p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => {
              const st = ORDER_STATUS[o.status];
              const qty = o.items.reduce((s, i) => s + i.quantity, 0);
              return (
                <li key={o.id}>
                  <Link href={`/r/${o.restaurant.slug}/order/${o.publicToken}`} className="block rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{o.restaurant.name}</p>
                        <p className="mt-0.5 text-xs text-stone">
                          #{o.number} · {ORDER_TYPE[o.type].label} · {qty} бүтээгдэхүүн · {formatDateTime(o.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <Badge tone={st.tone} dot>
                          {st.label}
                        </Badge>
                        <span className="font-mono text-sm">{formatMoney(o.total)}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
