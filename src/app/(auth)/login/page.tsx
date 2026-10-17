import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Нэвтрэх", robots: { index: false } };

export default function LoginPage() {
  return (
    <AuthShell
      title="Тавтай морил"
      subtitle="Рестораныхаа хянах самбарт нэвтэрнэ үү."
      footer={
        <p>
          Бүртгэлгүй юу?{" "}
          <Link href="/register" className="font-medium text-ink underline underline-offset-4">
            Бүртгүүлэх
          </Link>
        </p>
      }
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
