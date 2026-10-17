import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(420px,520px)]">
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-paper lg:flex lg:flex-col lg:justify-between">
        <div className="hairline-grid absolute inset-0 opacity-30 invert" aria-hidden="true" />
        <Link href="/" className="relative">
          <Logo tone="light" />
        </Link>
        <div className="relative max-w-md">
          <p className="font-serif text-4xl leading-[1.15] tracking-[-0.02em] text-balance">Захиалгаас борлуулалт хүртэл.</p>
          <p className="mt-4 text-[15px] leading-relaxed text-paper/65">QR меню, захиалга, ширээ, гал тогоо, тайланг нэг системээс удирдаарай.</p>
          <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-white/10 pt-6">
            {[
              ["QR", "Ширээ бүр өөрийн кодтой"],
              ["KDS", "Гал тогооны дэлгэц"],
              ["₮", "Борлуулалтын тайлан"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="font-mono text-lg text-ember">{k}</dt>
                <dd className="mt-1 text-xs leading-snug text-paper/55">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="relative text-xs text-paper/40">© TABLE.MN</p>
      </aside>
      <main className="flex flex-col justify-center px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-10 inline-block lg:hidden">
            <Logo />
          </Link>
          <h1 className="font-serif text-3xl tracking-[-0.02em]">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-stone">{subtitle}</p> : null}
          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-8 text-sm text-stone">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}
