import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Logo />
      <h1 className="mt-10 font-serif text-3xl">Ресторан олдсонгүй</h1>
      <p className="mt-2 max-w-sm text-sm text-stone">Холбоосыг шалгаад дахин оролдоно уу. QR код хуучирсан байж болзошгүй.</p>
      <ButtonLink href="/" variant="secondary" className="mt-6">
        TABLE.MN нүүр хуудас
      </ButtonLink>
      <Link href="/r/hotyn-buuz" className="mt-4 text-sm text-stone underline underline-offset-4">
        Демо меню үзэх
      </Link>
    </main>
  );
}
