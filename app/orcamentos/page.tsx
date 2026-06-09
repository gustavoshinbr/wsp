import { CalendarDays } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { QuoteComposer } from "@/components/QuoteComposer";
import { Card } from "@/components/Card";
import { QuoteRecord } from "@/components/QuoteRecord";
import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function OrcamentosPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
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
        status: true,
        total: true,
        notes: true,
        createdAt: true,
        client: { select: { name: true, phone: true } },
        motorcycle: { select: { plate: true, brand: true, model: true } },
        items: {
          select: {
            id: true,
            description: true,
            quantity: true,
            unitPrice: true,
            total: true,
          },
        },
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
  const quoteRecords = quotes.map((quote) => ({
    ...quote,
    total: Number(quote.total),
    createdAt: quote.createdAt.toISOString(),
    items: quote.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      total: Number(item.total),
    })),
  }));

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black">Orçamentos</h1>
          <p className="text-sm text-racing-muted">Crie o orçamento e acompanhe apenas os registros salvos.</p>
        </div>
        {query.error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{query.error}</div> : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <QuoteComposer
            clients={clients}
            motorcycles={motorcycles}
            products={quoteProducts}
            services={quoteServices}
            allowCustomPricing={user.role !== "STAFF"}
          />

          <Card className="h-fit p-4 sm:p-5 xl:sticky xl:top-6">
            <h2 className="flex items-center gap-2 text-lg font-black">
              <CalendarDays size={19} />
              Registros
            </h2>
            {quoteRecords.length ? (
              <div className="mt-4 overflow-hidden rounded-lg border border-racing-line">
                {quoteRecords.map((quote) => (
                  <QuoteRecord
                    key={quote.id}
                    quote={quote}
                    workshopName={user.workspace.workshopName}
                    workshopPhone={user.workspace.phone}
                    workshopEmail={user.workspace.email}
                    canDelete={user.role !== "STAFF"}
                  />
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
