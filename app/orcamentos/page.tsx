import { CheckCircle2, FileText, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DynamicQuoteItems } from "@/components/DynamicQuoteItems";
import { QuotePreview } from "@/components/QuotePreview";
import { requirePageUser } from "@/lib/auth";
import { brl } from "@/lib/currency";
import { prisma } from "@/lib/prisma";

export default async function OrcamentosPage({ searchParams }: { searchParams: { error?: string } }) {
  const user = await requirePageUser();
  const [clients, motorcycles, products, services, quotes] = await Promise.all([
    prisma.client.findMany({ where: { workspaceId: user.workspaceId }, orderBy: { name: "asc" } }),
    prisma.motorcycle.findMany({ where: { workspaceId: user.workspaceId }, include: { client: true }, orderBy: { plate: "asc" } }),
    prisma.product.findMany({ where: { workspaceId: user.workspaceId }, orderBy: { name: "asc" } }),
    prisma.service.findMany({ where: { workspaceId: user.workspaceId }, orderBy: { name: "asc" } }),
    prisma.quote.findMany({
      where: { workspaceId: user.workspaceId },
      include: { client: true, motorcycle: true, items: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);
  const quoteProducts = products.map((product) => ({
    id: product.id,
    label: `${product.name} - ${brl(product.sellPrice)}`,
  }));
  const quoteServices = services.map((service) => ({
    id: service.id,
    label: `${service.name} - ${brl(service.price)}`,
  }));

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black">Orçamentos</h1>
          <p className="text-sm text-racing-muted">Monte orçamento com cliente, moto, produtos, serviços, item manual e envio por WhatsApp.</p>
        </div>
        {searchParams.error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{searchParams.error}</div> : null}

        <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
          <Card>
            <h2 className="flex items-center gap-2 text-lg font-black">
              <FileText size={19} />
              Novo orçamento
            </h2>
            <form action="/api/orcamentos" method="post" className="mt-4 space-y-4">
              <select name="clientId" required className="h-11 rounded-lg px-3">
                <option value="">Selecione o cliente</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
              <select name="motorcycleId" className="h-11 rounded-lg px-3">
                <option value="">Moto opcional</option>
                {motorcycles.map((motorcycle) => (
                  <option key={motorcycle.id} value={motorcycle.id}>
                    {motorcycle.plate} - {motorcycle.client.name}
                  </option>
                ))}
              </select>

              <DynamicQuoteItems products={quoteProducts} services={quoteServices} />

              <div className="grid grid-cols-[1fr_120px] gap-2">
                <input name="manualDescription" className="h-11 rounded-lg px-3" placeholder="Item manual" />
                <input name="manualValue" type="number" step="0.01" className="h-11 rounded-lg px-3" placeholder="Valor" />
              </div>
              <textarea name="notes" rows={3} className="rounded-lg px-3 py-2" placeholder="Observações e validade do orçamento" />
              <Button type="submit" className="w-full">
                <Plus size={17} />
                Gerar orçamento
              </Button>
            </form>
          </Card>

          <section className="space-y-4">
            {quotes.map((quote) => (
              <div key={quote.id} className="space-y-2">
                <QuotePreview
                  quote={quote}
                  workshopName={user.workspace.workshopName}
                  workshopPhone={user.workspace.phone}
                  workshopEmail={user.workspace.email}
                />
                <div className="no-print flex flex-wrap gap-2">
                  {quote.status !== "APPROVED" && quote.status !== "PAID" ? (
                    <form action={`/api/orcamentos/${quote.id}`} method="post">
                      <input type="hidden" name="status" value="APPROVED" />
                      <button className="rounded-lg border border-racing-line px-3 py-2 text-sm font-bold">Aprovar</button>
                    </form>
                  ) : null}
                  {quote.status === "APPROVED" ? (
                    <form action={`/api/orcamentos/${quote.id}/finalizar`} method="post" className="flex flex-wrap gap-2">
                      <select name="paymentMethod" className="h-10 rounded-lg px-3 text-sm">
                        <option>Pix</option>
                        <option>Dinheiro</option>
                        <option>Cartao de credito</option>
                        <option>Cartao de debito</option>
                      </select>
                      <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-racing-red px-3 py-2 text-sm font-bold text-white">
                        <CheckCircle2 size={16} />
                        FINALIZAR
                      </button>
                    </form>
                  ) : null}
                  {quote.status === "PAID" ? (
                    <span className="inline-flex min-h-10 items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                      Finalizado
                    </span>
                  ) : null}
                  <form action={`/api/orcamentos/${quote.id}`} method="post">
                    <input type="hidden" name="_method" value="delete" />
                    <button className="inline-flex items-center gap-2 rounded-lg border border-racing-line px-3 py-2 text-sm font-bold text-racing-muted">
                      <Trash2 size={16} />
                      Excluir
                    </button>
                  </form>
                </div>
              </div>
            ))}
            {!quotes.length ? <Card>Nenhum orçamento criado ainda.</Card> : null}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
