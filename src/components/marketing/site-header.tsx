"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "#features", label: "Боломжууд" },
  { href: "#how", label: "Хэрхэн ажилладаг" },
  { href: "#pricing", label: "Үнэ" },
  { href: "#faq", label: "Түгээмэл асуулт" },
  { href: "#contact", label: "Холбоо барих" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open]);

  return (
    <header className={cn("sticky top-0 z-40 transition-colors", scrolled || open ? "border-b border-line bg-paper/95 backdrop-blur-sm" : "border-b border-transparent")}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5">
        <Link href="/" aria-label="TABLE.MN нүүр хуудас">
          <Logo />
        </Link>
        <nav aria-label="Үндсэн цэс" className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-stone transition-colors hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <ButtonLink href="/login" variant="ghost">
            Нэвтрэх
          </ButtonLink>
          <ButtonLink href="/register">Үнэгүй туршиж үзэх</ButtonLink>
        </div>
        <button
          className="grid h-10 w-10 place-items-center rounded-md hover:bg-sand lg:hidden"
          aria-label={open ? "Цэсийг хаах" : "Цэс нээх"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name={open ? "x" : "menu"} size={20} />
        </button>
      </div>
      {open ? (
        <div id="mobile-nav" className="border-t border-line bg-paper px-5 pb-6 pt-3 lg:hidden">
          <nav aria-label="Гар утасны цэс" className="flex flex-col">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="border-b border-line py-3.5 text-[15px]">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-5 grid gap-2">
            <ButtonLink href="/register" size="lg">
              Үнэгүй туршиж үзэх
            </ButtonLink>
            <ButtonLink href="/login" variant="secondary" size="lg">
              Нэвтрэх
            </ButtonLink>
          </div>
        </div>
      ) : null}
    </header>
  );
}
