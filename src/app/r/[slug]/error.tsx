"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <h1 className="font-serif text-2xl">Мэдээлэл ачааллахад алдаа гарлаа.</h1>
      <p className="mt-2 text-sm text-stone">Дахин оролдоно уу.</p>
      <Button className="mt-6" onClick={reset}>
        Дахин оролдох
      </Button>
    </main>
  );
}
