"use client";

import { useEffect } from "react";
import { Logo } from "@/components/brand/logo";
import { Button, ButtonLink } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Logo />
      <h1 className="mt-12 font-serif text-4xl tracking-[-0.02em]">Алдаа гарлаа</h1>
      <p className="mt-3 max-w-sm text-stone">Түр зуурын саатал гарсан байж болзошгүй. Дахин оролдоно уу.</p>
      {error.digest ? <p className="mt-2 font-mono text-xs text-stone-light">Код: {error.digest}</p> : null}
      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        <Button size="lg" onClick={reset}>
          Дахин оролдох
        </Button>
        <ButtonLink href="/" size="lg" variant="secondary">
          Нүүр хуудас
        </ButtonLink>
      </div>
    </main>
  );
}
