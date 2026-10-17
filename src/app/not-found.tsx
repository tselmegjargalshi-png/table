import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Logo />
      <p className="mt-12 font-mono text-sm text-ember">404</p>
      <h1 className="mt-2 font-serif text-4xl tracking-[-0.02em]">Хуудас олдсонгүй</h1>
      <p className="mt-3 max-w-sm text-stone">Таны хайсан хуудас устсан эсвэл холбоос буруу байна.</p>
      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        <ButtonLink href="/" size="lg">
          Нүүр хуудас руу очих
        </ButtonLink>
        <ButtonLink href="/login" size="lg" variant="secondary">
          Нэвтрэх
        </ButtonLink>
      </div>
    </main>
  );
}
