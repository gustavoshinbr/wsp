"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { brl, toNumber } from "@/lib/currency";

type QuotePdfData = {
  id: string;
  total: unknown;
  notes: string | null;
  createdAt: Date | string;
  client: { name: string; phone: string };
  motorcycle: { plate: string; brand: string | null; model: string | null } | null;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: unknown;
    total: unknown;
  }>;
};

export function QuotePdfButton({
  quote,
  workshopName,
  workshopPhone,
  workshopEmail,
  disabled = false,
}: {
  quote: QuotePdfData;
  workshopName: string;
  workshopPhone?: string | null;
  workshopEmail?: string | null;
  disabled?: boolean;
}) {
  const [generating, setGenerating] = useState(false);

  async function downloadPdf() {
    setGenerating(true);
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const quoteNumber = quote.id === "draft" ? "PREVIA" : quote.id.slice(-6).toUpperCase();
      const motorcycle = quote.motorcycle
        ? `${quote.motorcycle.plate} - ${[quote.motorcycle.brand, quote.motorcycle.model].filter(Boolean).join(" ")}`
        : "Não informada";

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 42, "F");
      doc.setFillColor(220, 38, 38);
      doc.rect(0, 42, 210, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(19);
      doc.text(workshopName, 14, 18);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text([workshopPhone, workshopEmail].filter(Boolean).join(" | "), 14, 26);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`ORÇAMENTO #${quoteNumber}`, 196, 16, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.text(new Intl.DateTimeFormat("pt-BR").format(new Date(quote.createdAt)), 196, 24, { align: "right" });

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("CLIENTE", 14, 55);
      doc.text("MOTO", 110, 55);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(quote.client.name || "Cliente não informado", 14, 62);
      doc.text(quote.client.phone || "-", 14, 68);
      doc.text(motorcycle, 110, 62, { maxWidth: 85 });

      autoTable(doc, {
        startY: 78,
        head: [["Descrição", "Qtd.", "Unitário", "Total"]],
        body: quote.items.map((item) => [
          item.description,
          String(item.quantity),
          brl(item.unitPrice as never),
          brl(item.total as never),
        ]),
        theme: "grid",
        styles: { font: "helvetica", fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { halign: "center", cellWidth: 18 },
          2: { halign: "right", cellWidth: 30 },
          3: { halign: "right", cellWidth: 30 },
        },
      });

      const tableEnd = (doc as typeof doc & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 85;
      const totalY = Math.min(tableEnd + 10, 250);
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(132, totalY, 64, 20, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("VALOR TOTAL", 138, totalY + 7);
      doc.setFontSize(16);
      doc.text(brl(toNumber(quote.total as never)), 190, totalY + 15, { align: "right" });

      doc.setTextColor(71, 85, 105);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const notes = doc.splitTextToSize(quote.notes || "Sem observações adicionais.", 110);
      doc.text("Observações:", 14, totalY + 6);
      doc.text(notes, 14, totalY + 12);
      doc.setDrawColor(203, 213, 225);
      doc.line(20, 278, 90, 278);
      doc.line(120, 278, 190, 278);
      doc.text("Assinatura do cliente", 55, 284, { align: "center" });
      doc.text("Responsável da oficina", 155, 284, { align: "center" });
      doc.setFontSize(8);
      doc.text("Documento de orçamento sem valor fiscal.", 105, 292, { align: "center" });

      doc.save(`orcamento-${quoteNumber.toLowerCase()}.pdf`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <button
      type="button"
      disabled={disabled || generating}
      className="no-print inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-racing-line px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
      onClick={downloadPdf}
    >
      <Download size={17} />
      {generating ? "Gerando..." : "Baixar PDF"}
    </button>
  );
}
