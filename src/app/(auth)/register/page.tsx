import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Бүртгүүлэх", robots: { index: false } };

export default function RegisterPage() {
  return (
    <AuthShell
      title="Ресторанаа бүртгүүлээрэй"
      subtitle="Бүртгүүлсний дараа 7 алхамт тохиргоогоор меню, ширээ, QR кодоо бэлдэнэ."
      footer={
        <p>
          Бүртгэлтэй юу?{" "}
          <Link href="/login" className="font-medium text-ink underline underline-offset-4">
            Нэвтрэх
          </Link>
        </p>
      }
    >
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
