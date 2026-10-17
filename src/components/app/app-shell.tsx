"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Logo, RestaurantMark } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { Icon, type IconName } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { api } from "@/lib/client/fetcher";
import { STAFF_ROLE } from "@/lib/labels";
import { menuUrl } from "@/lib/urls";
import type { StaffRole } from "@prisma/client";

type NavItem = { href: string; label: string; icon: IconName; roles?: StaffRole[]; exact?: boolean; mobilePrimary?: boolean };

const MANAGE: StaffRole[] = ["OWNER", "MANAGER"];

const NAV: NavItem[] = [
  { href: "/app", label: "Хянах самбар", icon: "dashboard", exact: true, mobilePrimary: true },
  { href: "/app/orders", label: "Захиалга", icon: "receipt", mobilePrimary: true },
  { href: "/app/tables", label: "Ширээ", icon: "table", mobilePrimary: true },
  { href: "/app/menu", label: "Меню", icon: "book", mobilePrimary: true },
  { href: "/app/reservations", label: "Урьдчилсан захиалга", icon: "calendar" },
  { href: "/app/customers", label: "Үйлчлүүлэгч", icon: "users" },
  { href: "/app/analytics", label: "Тайлан", icon: "chart", roles: MANAGE },
  { href: "/app/qr", label: "QR код", icon: "qr" },
  { href: "/app/settings", label: "Тохиргоо", icon: "settings", roles: MANAGE },
];

export type ShellProps = {
  user: { name: string; email: string };
  restaurant: { slug: string; name: string; brandColor: string; logoText: string | null; isDemo: boolean };
  role: StaffRole;
  restaurants: Array<{ id: string; name: string; active: boolean }>;
  children: ReactNode;
};

export function AppShell({ user, restaurant, role, restaurants, children }: ShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const items = NAV.filter((n) => !n.roles || n.roles.includes(role));
  const isActive = (n: NavItem) => (n.exact ? pathname === n.href : pathname.startsWith(n.href));
  const current = items.find(isActive);

  async function logout() {
    await api("/api/auth/logout", { method: "POST", body: {} });
    router.push("/");
    router.refresh();
  }

  const switchRestaurant = async (id: string) => {
    await api("/api/staff/switch", { body: { restaurantId: id } });
    router.refresh();
  };

  const account = (
    <Dropdown
      label="Бүртгэл"
      align="start"
      trigger={() => (
        <span className="flex w-full items-center gap-2.5 rounded-md p-2 text-left transition-colors hover:bg-sand">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-paper">{user.name.slice(0, 1).toUpperCase()}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium">{user.name}</span>
            <span className="block truncate text-xs text-stone">{STAFF_ROLE[role]}</span>
          </span>
          <Icon name="chevronDown" size={14} className="text-stone" />
        </span>
      )}
      items={[
        ...restaurants.filter((r) => !r.active).map((r) => ({ label: `${r.name} рүү шилжих`, icon: "store" as const, onSelect: () => void switchRestaurant(r.id) })),
        { label: "Гарах", icon: "logout", onSelect: () => void logout(), danger: true },
      ]}
    />
  );

  const navList = (onNavigate?: () => void) => (
    <nav aria-label="Үндсэн цэс" className="flex flex-col gap-0.5">
      {items.map((n) => {
        const active = isActive(n);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn("relative flex items-center gap-3 rounded-md px-3 py-2 text-[14px] font-medium transition-colors", active ? "text-ink" : "text-stone hover:bg-sand hover:text-ink")}
          >
            {active ? <motion.span layoutId="nav-active" className="absolute inset-0 rounded-md bg-sand" transition={{ type: "spring", bounce: 0.15, duration: 0.4 }} /> : null}
            <Icon name={n.icon} size={18} className={cn("relative", active && "text-ember")} />
            <span className="relative">{n.label}</span>
          </Link>
        );
      })}
      <div className="my-2 h-px bg-line" />
      <Link href="/kitchen" onClick={onNavigate} className="flex items-center gap-3 rounded-md px-3 py-2 text-[14px] font-medium text-stone transition-colors hover:bg-sand hover:text-ink">
        <Icon name="flame" size={18} />
        Гал тогоо
        <Icon name="external" size={13} className="ml-auto" />
      </Link>
      <a href={menuUrl(restaurant.slug)} target="_blank" rel="noreferrer" onClick={onNavigate} className="flex items-center gap-3 rounded-md px-3 py-2 text-[14px] font-medium text-stone transition-colors hover:bg-sand hover:text-ink">
        <Icon name="eye" size={18} />
        Цахим меню
        <Icon name="external" size={13} className="ml-auto" />
      </a>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface px-3 py-4 lg:flex">
        <Link href="/app" className="mb-5 px-2">
          <Logo />
        </Link>
        <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-line bg-paper px-3 py-2.5">
          <RestaurantMark name={restaurant.name} text={restaurant.logoText} color={restaurant.brandColor} size={32} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold">{restaurant.name}</p>
            {restaurant.isDemo ? <Badge tone="warning" size="sm">Демо</Badge> : <p className="text-xs text-stone">Ресторан</p>}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">{navList()}</div>
        <div className="mt-2 border-t border-line pt-3">{account}</div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur lg:hidden">
          <IconButton icon="menu" label="Цэс нээх" onClick={() => setNavOpen(true)} />
          <p className="min-w-0 flex-1 truncate text-[15px] font-semibold">{current?.label ?? restaurant.name}</p>
          {restaurant.isDemo ? <Badge tone="warning" size="sm">Демо</Badge> : null}
        </header>

        <main id="main" className="min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          <div className="mx-auto w-full max-w-[1280px]">{children}</div>
        </main>

        <nav aria-label="Түргэн цэс" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
          {[...items.filter((n) => n.mobilePrimary).slice(0, 4)].map((n) => {
            const active = isActive(n);
            return (
              <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={cn("flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium", active ? "text-ember" : "text-stone")}>
                <Icon name={n.icon} size={21} />
                {n.label === "Хянах самбар" ? "Самбар" : n.label}
              </Link>
            );
          })}
          <button onClick={() => setNavOpen(true)} className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-stone">
            <Icon name="more" size={21} />
            Бусад
          </button>
        </nav>
      </div>

      <Modal open={navOpen} onClose={() => setNavOpen(false)} title={restaurant.name} variant="sheet" size="sm">
        <div className="-mx-2">{navList(() => setNavOpen(false))}</div>
        <div className="mt-4 border-t border-line pt-3">{account}</div>
      </Modal>
    </div>
  );
}
