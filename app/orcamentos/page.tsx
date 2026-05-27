import { CalendarDays, FileText, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { CartBuilder } from "@/components/CartBuilder";
import { Card } from "@/components/Card";
import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const quoteDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default async function OrcamentosPage({ searchParams }: { searchParams: { error?: string } }) {
  const user = await requirePageUser();
  const [clients, motorcycles, products, services, quotes] = await Promise.all([
    prisma.client.findMany({ where: { workspaceId: user.workspaceId }, orderBy: { name: "asc" } }),
    prisma.motorcycle.findMany({ where: { workspaceId: user.workspaceId }, include: { client: true }, orderBy: { plate: "asc" } }),
    prisma.product.findMany({ where: { workspaceId: user.workspaceId }, orderBy: { name: "asc" } }),
    prisma.service.findMany({ where: { workspaceId: user.workspaceId }, orderBy: { name: "asc" } }),
    prisma.quote.findMany({
      where: { workspaceId: user.workspaceId },
      select: {
        id: true,
        createdAt: true,
        client: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);
  const quoteProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    barcode: product.barcode,
    sellPrice: Number(product.sellPrice),
    quantity: product.quantity,
  }));
  const quoteServices = services.map((service) => ({
    id: service.id,
    name: service.name,
    price: Number(service.price),
  }));

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black">Orçamentos</h1>
          <p className="text-sm text-racing-muted">Crie o orçamento e acompanhe apenas os registros salvos.</p>
        </div>
        {searchParams.error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{searchParams.error}</div> : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-lg font-black">
              <FileText size={19} />
              Novo orçamento
            </h2>
            <form action="/api/orcamentos" method="post" className="mt-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
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
              </div>

              <CartBuilder products={quoteProducts} services={quoteServices} />
              <textarea name="notes" rows={2} className="rounded-lg px-3 py-2" placeholder="Observações e validade do orçamento" />
              <Button type="submit" className="w-full">
                <Plus size={17} />
                Gerar orçamento
              </Button>
            </form>
          </Card>

          <Card className="h-fit p-4 sm:p-5 xl:sticky xl:top-6">
            <h2 className="flex items-center gap-2 text-lg font-black">
              <CalendarDays size={19} />
              Registros
            </h2>
            {quotes.length ? (
              <div className="mt-4 overflow-hidden rounded-lg border border-racing-line">
                {quotes.map((quote) => (
                  <div key={quote.id} className="flex items-center justify-between gap-3 border-b border-racing-line px-3 py-3 last:border-b-0">
                    <span className="min-w-0 truncate text-sm font-black">{quote.client.name}</span>
                    <time className="shrink-0 text-sm font-semibold text-racing-muted" dateTime={quote.createdAt.toISOString()}>
                      {quoteDateFormatter.format(quote.createdAt)}
                    </time>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-lg border border-dashed border-racing-line p-4 text-sm font-semibold text-racing-muted">
                Nenhum orçamento criado ainda.
              </p>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
