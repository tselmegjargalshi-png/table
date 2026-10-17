"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client/fetcher";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="secondary"
      icon="logout"
      loading={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await api("/api/auth/logout", { method: "POST", body: {} });
        } finally {
          router.push("/");
          router.refresh();
        }
      }}
    >
      Гарах
    </Button>
  );
}
