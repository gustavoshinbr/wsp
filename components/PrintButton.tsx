"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Imprimir/PDF", targetId }: { label?: string; targetId?: string }) {
  function printTarget() {
    const target = targetId ? document.getElementById(targetId) : null;

    if (target) {
      document.body.classList.add("printing-quote");
      target.classList.add("print-active");
      window.addEventListener(
        "afterprint",
        () => {
          target.classList.remove("print-active");
          document.body.classList.remove("printing-quote");
        },
        { once: true },
      );
    }

    window.print();
  }

  return (
    <button
      type="button"
      className="no-print inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-racing-line px-4 py-2 text-sm font-bold"
      onClick={printTarget}
    >
      <Printer size={17} />
      {label}
    </button>
  );
}
