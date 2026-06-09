import Link from "next/link";
import { Clock3, Plus, ShoppingCart, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { CartBuilder } from "@/components/CartBuilder";
import { Card } from "@/components/Card";
import { SaleActions } from "@/components/SaleActions";
import { requirePageUser } from "@/lib/auth";
import { brl } from "@/lib/currency";
import { prisma } from "@/lib/prisma";

export default async function VendasPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  const user = await requirePageUser();
  const [clients, motorcycles, mechanics, products, services, sales, openCreditSales] = await Promise.all([
    prisma.client.findMany({ where: { workspaceId: user.workspaceId }, orderBy: { name: "asc" } }),
    prisma.motorcycle.findMany({ where: { workspaceId: user.workspaceId }, include: { client: true }, orderBy: { plate: "asc" } }),
    prisma.user.findMany({ where: { workspaceId: user.workspaceId, isActive: true, isMechanic: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { workspaceId: user.workspaceId }, orderBy: { name: "asc" } }),
    prisma.service.findMany({ where: { workspaceId: user.workspaceId }, orderBy: { name: "asc" } }),
    prisma.sale.findMany({
      where: { workspaceId: user.workspaceId },
      include: {
        client: true,
        motorcycle: true,
        mechanic: true,
        items: true,
        fiscalDocuments: { select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.sale.count({ where: { workspaceId: user.workspaceId, paymentStatus: "CREDIT_OPEN" } }),
  ]);
  const productOptions = products.map((product) => ({
    id: product.id,
    name: product.name,
    barcode: product.barcode,
    sellPrice: Number(product.sellPrice),
    quantity: product.quantity,
  }));
  const serviceOptions = services.map((service) => ({
    id: service.id,
    name: service.name,
    price: Number(service.price),
  }));
  const clientOptions = clients.map((client) => ({ id: client.id, name: client.name }));
  const motorcycleOptions = motorcycles.map((motorcycle) => ({
    id: motorcycle.id,
    plate: motorcycle.plate,
    clientId: motorcycle.clientId,
    clientName: motorcycle.client.name,
  }));
  const mechanicOptions = mechanics.map((mechanic) => ({ id: mechanic.id, name: mechanic.name }));

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black">PDV / Vendas</h1>
            <p className="text-sm text-racing-muted">Venda com leitor de código de barras, mecânico responsável e compra a prazo.</p>
          </div>
          <Link href="/vendas-a-prazo" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-racing-line px-4 py-2 text-sm font-black">
            <Clock3 size={17} />
            Vendas a prazo ({openCreditSales})
          </Link>
        </div>
        {query.error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{query.error}</div> : null}

        <div className="grid gap-6 xl:grid-cols-[480px_1fr]">
          <Card>
            <h2 className="flex items-center gap-2 text-lg font-black">
              <ShoppingCart size={19} />
              Nova venda
            </h2>
            <form action="/api/vendas" method="post" className="mt-4 space-y-4">
              <select name="clientId" className="h-11 rounded-lg px-3">
                <option value="">Cliente opcional</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
              <select name="motorcycleId" className="h-11 rounded-lg px-3">
                <option value="">Moto opcional</option>
                {motorcycles.map((motorcycle) => <option key={motorcycle.id} value={motorcycle.id}>{motorcycle.plate} - {motorcycle.client.name}</option>)}
              </select>
              <select name="mechanicId" className="h-11 rounded-lg px-3">
                <option value="">Mecânico responsável</option>
                {mechanics.map((mechanic) => <option key={mechanic.id} value={mechanic.id}>{mechanic.name}</option>)}
              </select>

              <CartBuilder
                products={productOptions}
                services={serviceOptions}
                allowCustomPricing={user.role !== "STAFF"}
              />

              <div className="grid gap-2 sm:grid-cols-2">
                <select name="paymentMethod" className="h-11 rounded-lg px-3">
                  <option>Pix</option>
                  <option>Dinheiro</option>
                  <option>Cartão de crédito</option>
                  <option>Cartão de débito</option>
                  <option>A prazo</option>
                </select>
                <input name="dueDate" type="date" className="h-11 rounded-lg px-3" title="Vencimento para venda a prazo" />
              </div>
              <Button type="submit" className="w-full">
                <Plus size={17} />
                Concluir venda
              </Button>
            </form>
          </Card>

          <section className="space-y-3">
            {sales.map((sale) => (
              <Card key={sale.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-black">{sale.client?.name || "Venda avulsa"}</h2>
                      {sale.paymentStatus === "CREDIT_OPEN" ? <Badge tone="amber">A prazo em aberto</Badge> : null}
                      {sale.paymentStatus === "CREDIT_PAID" ? <Badge tone="green">A prazo quitada</Badge> : null}
                    </div>
                    <p className="text-sm text-racing-muted">
                      {sale.createdAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} · {sale.paymentMethod || "Sem forma"}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-sm text-racing-muted">
                      <UserRound size={14} />
                      {sale.mechanic?.name || "Sem mecânico"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm text-racing-muted">
                      {sale.items.map((item) => <span key={item.id}>{item.quantity}x {item.description}</span>)}
                    </div>
                  </div>
                  <div className="space-y-3 sm:text-right">
                    <strong className="block text-xl">{brl(sale.total)}</strong>
                    <SaleActions
                      sale={{
                        id: sale.id,
                        clientId: sale.clientId,
                        motorcycleId: sale.motorcycleId,
                        mechanicId: sale.mechanicId,
                        paymentMethod: sale.paymentMethod,
                        paymentStatus: sale.paymentStatus,
                        dueDate: sale.dueDate ? sale.dueDate.toISOString().slice(0, 10) : null,
                        lockedByFiscal: sale.fiscalDocuments.some((document) => document.status === "AUTHORIZED" || document.status === "PROCESSING"),
                        items: sale.items.map((item) => ({
                          id: item.id,
                          description: item.description,
                          quantity: item.quantity,
                          unitPrice: Number(item.unitPrice),
                          catalogItem: Boolean(item.productId || item.serviceId),
                        })),
                      }}
                      clients={clientOptions}
                      motorcycles={motorcycleOptions}
                      mechanics={mechanicOptions}
                      canManage={user.role !== "STAFF"}
                    />
                  </div>
                </div>
              </Card>
            ))}
            {!sales.length ? <Card>Nenhuma venda registrada.</Card> : null}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
