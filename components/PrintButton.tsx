"use client";

import { Printer } from "lucide-react";
import { useSystemDialog } from "@/components/SystemDialogProvider";

export function PrintButton({
  label = "Imprimir/PDF",
  targetId,
  format = "document",
}: {
  label?: string;
  targetId?: string;
  format?: "document" | "receipt";
}) {
  const { alert } = useSystemDialog();

  async function printTarget() {
    const target = targetId ? document.getElementById(targetId) : null;

    if (target) {
      const printWindow = window.open("", `wsp-print-${Date.now()}`);
      if (!printWindow) {
        await alert({
          title: "Impressão bloqueada",
          message: "O navegador bloqueou a janela de impressão. Permita pop-ups para imprimir somente o cupom.",
        });
        return;
      }

      const printDocument = printWindow.document;
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
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <base href="${document.baseURI}" />
            <title>Impressão - WSP Racing</title>
            ${styles}
            <style>
              ${pageStyles}
              html, body {
                margin: 0 !important;
                background: #fff !important;
                color: #111827 !important;
              }
              body { padding: 16px !important; }
              .print-actions {
                position: sticky;
                top: 0;
                z-index: 50;
                display: flex;
                justify-content: center;
                gap: 8px;
                margin: 0 auto 16px;
                padding: 10px;
                background: #fff;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                box-shadow: 0 8px 24px rgb(0 0 0 / 10%);
                max-width: 420px;
              }
              .print-actions button {
                min-height: 44px;
                padding: 10px 16px;
                border: 0;
                border-radius: 8px;
                background: #dc2626;
                color: #fff;
                font: 700 14px system-ui, sans-serif;
              }
              .print-actions .secondary { background: #111827; }
              #print-document > * {
                margin: 0 !important;
                border: 0 !important;
                border-radius: 0 !important;
                box-shadow: none !important;
              }
              @media print {
                body { padding: 0 !important; }
                .print-actions, .no-print { display: none !important; }
              }
            </style>
          </head>
          <body>
            <div class="print-actions">
              <button id="print-now" type="button">Imprimir cupom</button>
              <button id="close-print" type="button" class="secondary">Fechar</button>
            </div>
            <main id="print-document">${target.outerHTML}</main>
          </body>
        </html>`);
      printDocument.close();

      printDocument.getElementById("print-now")?.addEventListener("click", () => printWindow.print());
      printDocument.getElementById("close-print")?.addEventListener("click", () => printWindow.close());
      window.setTimeout(async () => {
        await printDocument.fonts?.ready;
        printWindow.focus();
        printWindow.print();
      }, 250);
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
