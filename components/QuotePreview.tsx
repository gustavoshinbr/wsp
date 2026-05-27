import Image from "next/image";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { PrintButton } from "@/components/PrintButton";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { brl, toNumber } from "@/lib/currency";
import { quoteWhatsAppMessage, whatsappUrl } from "@/lib/whatsapp";

export function QuotePreview({
  quote,
  workshopName,
}: {
  workshopName: string;
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
      product?: { mainImageUrl: string | null } | null;
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
  const statusLabel = quote.status === "PAID" ? "FINALIZADO" : quote.status;

  return (
    <Card className="print:shadow-none">
      <div className="flex flex-col gap-3 border-b border-racing-line pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-racing-red">WSP Racing</p>
          <h2 className="text-2xl font-black">Orçamento #{quote.id.slice(-6).toUpperCase()}</h2>
          <p className="text-sm text-racing-muted">
            {format(quote.createdAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <Badge tone={statusTone}>{statusLabel}</Badge>
      </div>
      <div className="grid gap-4 border-b border-racing-line py-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase text-racing-muted">Cliente</p>
          <p className="font-black">{quote.client.name}</p>
          <p className="text-sm text-racing-muted">{quote.client.phone}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-racing-muted">Moto</p>
          <p className="font-black">{motorcycle || "Não informada"}</p>
        </div>
      </div>
      <div className="divide-y divide-racing-line">
        {quote.items.map((item) => (
          <div key={item.id} className="flex gap-3 py-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-racing-soft">
              {item.product?.mainImageUrl ? <Image src={item.product.mainImageUrl} alt={item.description} fill className="object-cover" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{item.description}</p>
              <p className="text-sm text-racing-muted">
                {item.quantity} x {brl(item.unitPrice as never)}
              </p>
            </div>
            <strong>{brl(item.total as never)}</strong>
          </div>
        ))}
      </div>
      {quote.notes ? <p className="mt-3 rounded-lg bg-racing-soft p-3 text-sm text-racing-muted">{quote.notes}</p> : null}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <strong className="text-2xl font-black">Total {brl(quote.total as never)}</strong>
        <div className="flex flex-col gap-2 sm:flex-row">
          <PrintButton />
          <WhatsAppButton href={whatsappUrl(quote.client.phone, message)} />
        </div>
      </div>
    </Card>
  );
}
