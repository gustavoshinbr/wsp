import { CheckCircle2, Trash2 } from "lucide-react";
import { PrintButton } from "@/components/PrintButton";
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
    createdAt: Date;
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
  const printTargetId = `quote-pdf-${quote.id}`;
  const quoteNumber = quote.id.slice(-6).toUpperCase();
  const quoteDate = quoteDateFormatter.format(quote.createdAt);
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
          <PrintButton label="Baixar PDF" targetId={printTargetId} />
          <WhatsAppButton href={whatsappUrl(quote.client.phone, message)} label="Compartilhar" />
        </div>

        {canFinalize ? (
          <form action={`/api/orcamentos/${quote.id}/finalizar`} method="post">
            <input type="hidden" name="paymentMethod" value="A vista" />
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

      <article
        id={printTargetId}
        className="quote-pdf pointer-events-none fixed left-[-10000px] top-0 w-[794px] overflow-hidden rounded-lg border border-racing-line bg-white text-slate-950 shadow-sm print:pointer-events-auto print:rounded-none print:border-0 print:shadow-none"
      >
        <header className="border-b-4 border-rose-600 bg-slate-950 px-6 py-6 text-white print:px-8">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-300">Orcamento tecnico</p>
              <h2 className="mt-1 text-2xl font-black">{workshopName}</h2>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-300">
                {workshopPhone ? <span>{workshopPhone}</span> : null}
                {workshopEmail ? <span>{workshopEmail}</span> : null}
              </div>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-right">
              <p className="text-xs font-bold uppercase text-slate-300">Numero</p>
              <p className="text-xl font-black">#{quoteNumber}</p>
              <p className="mt-1 text-xs text-slate-300">{quoteDate}</p>
            </div>
          </div>
        </header>

        <div className="space-y-6 p-6 print:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase text-slate-500">Cliente</p>
              <p className="mt-2 text-lg font-black">{quote.client.name}</p>
              <p className="text-sm font-semibold text-slate-600">{quote.client.phone}</p>
            </section>
            <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase text-slate-500">Moto</p>
              <p className="mt-2 text-lg font-black">{motorcycle || "Nao informada"}</p>
            </section>
          </div>

          <section>
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-rose-600">Itens do orcamento</p>
                <h3 className="text-xl font-black">Produtos e servicos</h3>
              </div>
              <span className="text-xs font-bold text-slate-500">{quote.items.length} item(ns)</span>
            </div>
            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase">Descricao</th>
                  <th className="w-20 px-4 py-3 text-center text-xs font-black uppercase">Qtd</th>
                  <th className="w-32 px-4 py-3 text-right text-xs font-black uppercase">Unitario</th>
                  <th className="w-32 px-4 py-3 text-right text-xs font-black uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-200 even:bg-slate-50">
                    <td className="px-4 py-3 font-bold">{item.description}</td>
                    <td className="px-4 py-3 text-center font-semibold">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-semibold">{brl(item.unitPrice as never)}</td>
                    <td className="px-4 py-3 text-right font-black">{brl(item.total as never)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <section className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-black uppercase text-slate-500">Observacoes</p>
              <p className="mt-2 min-h-16 text-sm font-medium leading-6 text-slate-700">
                {quote.notes || "Sem observacoes adicionais."}
              </p>
            </section>
            <section className="rounded-lg bg-slate-950 p-5 text-white">
              <p className="text-xs font-black uppercase text-slate-300">Valor total</p>
              <p className="mt-3 text-3xl font-black">{brl(total)}</p>
            </section>
          </div>
        </div>
      </article>
    </div>
  );
}
