"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Imprimir/PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      className="no-print inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-racing-line px-4 py-2 text-sm font-bold"
      onClick={() => window.print()}
    >
      <Printer size={17} />
      {label}
    </button>
  );
}
