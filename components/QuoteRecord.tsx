import { CheckCircle2, Trash2 } from "lucide-react";
import { QuotePdfButton } from "@/components/QuotePdfButton";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { brl, toNumber } from "@/lib/currency";
import { quoteWhatsAppMessage, whatsappUrl } from "@/lib/whatsapp";

const quoteDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

type QuoteRecordProps = {
  workshopName: string;
  workshopPhone?: string | null;
  workshopEmail?: string | null;
  quote: {
    id: string;
    status: string;
    total: unknown;
    notes: string | null;
    createdAt: Date | string;
    client: { name: string; phone: string };
    motorcycle: { plate: string; brand: string | null; model: string | null } | null;
    items: Array<{
      id: string;
      description: string;
      quantity: number;
      unitPrice: unknown;
      total: unknown;
    }>;
  };
};

export function QuoteRecord({ quote, workshopName, workshopPhone, workshopEmail }: QuoteRecordProps) {
  const quoteDate = quoteDateFormatter.format(new Date(quote.createdAt));
  const motorcycle = quote.motorcycle
    ? `${quote.motorcycle.plate} - ${[quote.motorcycle.brand, quote.motorcycle.model].filter(Boolean).join(" ")}`
    : null;
  const total = toNumber(quote.total as never);
  const canDelete = quote.status !== "APPROVED" && quote.status !== "PAID";
  const canFinalize = quote.status !== "PAID" && quote.status !== "CANCELLED";
  const message = quoteWhatsAppMessage({
    workshopName,
    clientName: quote.client.name,
    motorcycle,
    items: quote.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      total: toNumber(item.total as never),
    })),
    total,
  });

  return (
    <div className="border-b border-racing-line p-3 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black">{quote.client.name}</p>
          <p className="mt-1 text-xs font-semibold text-racing-muted">{quoteDate}</p>
        </div>
        <strong className="shrink-0 text-sm font-black text-racing-red">{brl(total)}</strong>
      </div>

      <div className="mt-3 grid gap-2">
        <div className="grid gap-2 sm:grid-cols-2">
          <QuotePdfButton
            quote={quote}
            workshopName={workshopName}
            workshopPhone={workshopPhone}
            workshopEmail={workshopEmail}
          />
          <WhatsAppButton href={whatsappUrl(quote.client.phone, message)} label="Compartilhar" />
        </div>

        {canFinalize ? (
          <form action={`/api/orcamentos/${quote.id}/finalizar`} method="post">
            <input type="hidden" name="paymentMethod" value="À vista" />
            <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-racing-red px-3 py-2 text-sm font-black text-white hover:bg-red-700">
              <CheckCircle2 size={16} />
              Aprovar e finalizar
            </button>
          </form>
        ) : quote.status === "PAID" ? (
          <span className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            Finalizado no saldo
          </span>
        ) : (
          <span className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-racing-line bg-racing-soft px-3 py-2 text-sm font-black text-racing-muted">
            Cancelado
          </span>
        )}

        {canDelete ? (
          <form action={`/api/orcamentos/${quote.id}`} method="post">
            <input type="hidden" name="_method" value="delete" />
            <button className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-racing-line px-3 py-2 text-sm font-bold text-racing-muted hover:bg-racing-soft">
              <Trash2 size={16} />
              Excluir
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
