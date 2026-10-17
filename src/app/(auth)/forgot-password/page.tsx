import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Нууц үг сэргээх", robots: { index: false } };

export default function ForgotPage() {
  return (
    <AuthShell title="Нууц үг сэргээх" subtitle="Бүртгэлтэй имэйл хаягаа оруулбал сэргээх холбоос илгээнэ.">
      <ForgotForm />
    </AuthShell>
  );
}
