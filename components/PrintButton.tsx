"use client";

import { Printer } from "lucide-react";

export function PrintButton({
  label = "Imprimir/PDF",
  targetId,
  format = "document",
}: {
  label?: string;
  targetId?: string;
  format?: "document" | "receipt";
}) {
  function printTarget() {
    const target = targetId ? document.getElementById(targetId) : null;

    if (target) {
      const printRoot = document.createElement("div");
      printRoot.className = `print-root print-root--${format}`;
      printRoot.setAttribute("aria-hidden", "true");
      printRoot.appendChild(target.cloneNode(true));
      document.body.appendChild(printRoot);
      document.body.classList.add("printing-document");

      const cleanup = () => {
        printRoot.remove();
        document.body.classList.remove("printing-document");
      };
      window.addEventListener("afterprint", cleanup, { once: true });
      window.setTimeout(() => {
        window.print();
        window.setTimeout(cleanup, 1000);
      }, 50);
      return;
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
