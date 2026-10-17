"use client";

import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/feedback";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="font-serif text-2xl">Хуудсыг ачаалж чадсангүй</h1>
      <p className="mt-2 text-sm text-stone">Холболтоо шалгаад дахин оролдоно уу.</p>
      <div className="mt-6">
        <ErrorNotice message="Мэдээлэл ачааллахад алдаа гарлаа." />
      </div>
      <Button className="mt-5" onClick={reset}>
        Дахин оролдох
      </Button>
    </div>
  );
}
