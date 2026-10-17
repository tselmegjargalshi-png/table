"use client";

import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button icon="printer" onClick={() => window.print()}>
      Хэвлэх
    </Button>
  );
}
