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
  function removeFrame(frame: HTMLIFrameElement) {
    window.setTimeout(() => frame.remove(), 0);
  }

  function printTarget() {
    const target = targetId ? document.getElementById(targetId) : null;

    if (target) {
      const frame = document.createElement("iframe");
      frame.title = "Documento para impressão";
      frame.setAttribute("aria-hidden", "true");
      frame.style.position = "fixed";
      frame.style.right = "0";
      frame.style.bottom = "0";
      frame.style.width = "0";
      frame.style.height = "0";
      frame.style.border = "0";
      frame.style.opacity = "0";
      document.body.appendChild(frame);

      const printWindow = frame.contentWindow;
      const printDocument = frame.contentDocument;
      if (!printWindow || !printDocument) {
        frame.remove();
        return;
      }

      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map((node) => node.outerHTML)
        .join("");
      const pageStyles = format === "receipt"
        ? `
          @page { size: 80mm auto; margin: 4mm; }
          #print-document { width: 72mm; margin: 0 auto; }
        `
        : `
          @page { size: A4 portrait; margin: 10mm; }
          #print-document { width: 100%; margin: 0 auto; }
        `;

      printDocument.open();
      printDocument.write(`<!doctype html>
        <html lang="pt-BR">
          <head>
            <meta charset="utf-8" />
            <title>${document.title}</title>
            ${styles}
            <style>
              ${pageStyles}
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #fff !important;
                color: #111827 !important;
              }
              .no-print { display: none !important; }
              #print-document > * {
                margin: 0 !important;
                border: 0 !important;
                border-radius: 0 !important;
                box-shadow: none !important;
              }
            </style>
          </head>
          <body>
            <main id="print-document">${target.outerHTML}</main>
          </body>
        </html>`);
      printDocument.close();

      const cleanup = () => removeFrame(frame);
      printWindow.addEventListener("afterprint", cleanup, { once: true });
      window.setTimeout(async () => {
        await printDocument.fonts?.ready;
        printWindow.focus();
        printWindow.print();
      }, 150);
      window.setTimeout(cleanup, 60_000);
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
