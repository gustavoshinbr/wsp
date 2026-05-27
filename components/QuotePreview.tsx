import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/Badge";
import { PrintButton } from "@/components/PrintButton";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { brl, toNumber } from "@/lib/currency";
import { quoteWhatsAppMessage, whatsappUrl } from "@/lib/whatsapp";

export function QuotePreview({
  quote,
  workshopName,
  workshopPhone,
  workshopEmail,
}: {
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
}) {
  const motorcycle = quote.motorcycle
    ? `${quote.motorcycle.plate} - ${[quote.motorcycle.brand, quote.motorcycle.model].filter(Boolean).join(" ")}`
    : null;
  const message = quoteWhatsAppMessage({
    workshopName,
    clientName: quote.client.name,
    motorcycle,
    items: quote.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      total: toNumber(item.total as never),
    })),
    total: toNumber(quote.total as never),
  });
  const statusTone = quote.status === "PAID" || quote.status === "APPROVED" ? "green" : quote.status === "CANCELLED" ? "red" : "amber";
  const statusLabels: Record<string, string> = {
    DRAFT: "RASCUNHO",
    SENT: "ENVIADO",
    APPROVED: "APROVADO",
    CANCELLED: "CANCELADO",
    PAID: "FINALIZADO",
  };
  const statusLabel = statusLabels[quote.status] || quote.status;
  const quoteNumber = quote.id.slice(-6).toUpperCase();
  const printTargetId = `quote-pdf-${quote.id}`;

  return (
    <div className="space-y-3">
      <article
        id={printTargetId}
        className="quote-pdf overflow-hidden rounded-lg border border-racing-line bg-white text-slate-950 shadow-sm print:rounded-none print:border-0 print:shadow-none"
      >
        <header className="border-b-4 border-rose-600 bg-slate-950 px-6 py-6 text-white print:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-white text-sm font-black italic text-slate-950">
                WSP
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-300">Orcamento tecnico</p>
                <h2 className="mt-1 text-2xl font-black">{workshopName}</h2>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-300">
                  {workshopPhone ? <span>{workshopPhone}</span> : null}
                  {workshopEmail ? <span>{workshopEmail}</span> : null}
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-left sm:text-right">
              <p className="text-xs font-bold uppercase text-slate-300">Numero</p>
              <p className="text-xl font-black">#{quoteNumber}</p>
              <p className="mt-1 text-xs text-slate-300">
                {format(quote.createdAt, "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-6 p-6 print:p-8">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_150px]">
            <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase text-slate-500">Cliente</p>
              <p className="mt-2 text-lg font-black">{quote.client.name}</p>
              <p className="text-sm font-semibold text-slate-600">{quote.client.phone}</p>
            </section>
            <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase text-slate-500">Moto</p>
              <p className="mt-2 text-lg font-black">{motorcycle || "Nao informada"}</p>
            </section>
            <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase text-slate-500">Status</p>
              <div className="mt-2">
                <Badge tone={statusTone}>{statusLabel}</Badge>
              </div>
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
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[620px] border-collapse text-sm">
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
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-[1fr_260px]">
            <section className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-black uppercase text-slate-500">Observacoes</p>
              <p className="mt-2 min-h-16 text-sm font-medium leading-6 text-slate-700">
                {quote.notes || "Sem observacoes adicionais."}
              </p>
            </section>
            <section className="rounded-lg bg-slate-950 p-5 text-white">
              <p className="text-xs font-black uppercase text-slate-300">Valor total</p>
              <p className="mt-3 text-3xl font-black">{brl(quote.total as never)}</p>
            </section>
          </div>

          <div className="grid gap-8 pt-8 text-center text-xs font-bold text-slate-500 sm:grid-cols-2">
            <div className="border-t border-slate-300 pt-3">Assinatura do cliente</div>
            <div className="border-t border-slate-300 pt-3">Responsavel da oficina</div>
          </div>

          <footer className="border-t border-slate-200 pt-4 text-center text-xs font-semibold text-slate-500">
            Documento gerado pelo WSP Racing. Valores sujeitos a alteracao mediante aprovacao do cliente.
          </footer>
        </div>
      </article>

      <div className="no-print flex flex-col gap-2 sm:flex-row sm:justify-end">
        <PrintButton label="Gerar PDF" targetId={printTargetId} />
        <WhatsAppButton href={whatsappUrl(quote.client.phone, message)} />
      </div>
    </div>
  );
}
