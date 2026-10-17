import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Шинэ нууц үг", robots: { index: false } };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <AuthShell title="Шинэ нууц үг тохируулах">
      {token ? (
        <ResetForm token={token} />
      ) : (
        <p className="text-sm text-stone">
          Холбоос буруу байна.{" "}
          <Link href="/forgot-password" className="font-medium text-ink underline underline-offset-4">
            Шинээр хүсэлт илгээнэ үү.
          </Link>
        </p>
      )}
    </AuthShell>
  );
}
