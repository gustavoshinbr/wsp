import { Clock3, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { requirePageUser } from "@/lib/auth";
import { brl } from "@/lib/currency";
import { prisma } from "@/lib/prisma";

export default async function VendasAPrazoPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  const user = await requirePageUser();
  const [openSales, paidSales] = await Promise.all([
    prisma.sale.findMany({
      where: { workspaceId: user.workspaceId, paymentStatus: "CREDIT_OPEN" },
      include: { client: true, mechanic: true, items: true },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    }),
    prisma.sale.findMany({
      where: { workspaceId: user.workspaceId, paymentStatus: "CREDIT_PAID" },
      include: { client: true, mechanic: true },
      orderBy: { paidAt: "desc" },
      take: 12,
    }),
  ]);
  const openTotal = openSales.reduce((sum, sale) => sum + Number(sale.total), 0);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black">Vendas a prazo</h1>
          <p className="text-sm text-racing-muted">Acompanhe clientes que ainda precisam pagar e finalize a compra quando receber.</p>
        </div>
        {query.error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{query.error}</div> : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <Card title="Em aberto" value={openSales.length} />
          <Card title="Total a receber" value={brl(openTotal)} />
          <Card title="Quitadas recentes" value={paidSales.length} />
        </div>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-xl font-black">
            <Clock3 size={20} className="text-racing-red" />
            Em aberto
          </h2>
          {openSales.map((sale) => (
            <Card key={sale.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black">{sale.client?.name || "Cliente não informado"}</h3>
                    <Badge tone="amber">A prazo</Badge>
                  </div>
                  <p className="mt-1 text-sm text-racing-muted">
                    Venda #{sale.id.slice(-8).toUpperCase()} · {sale.createdAt.toLocaleDateString("pt-BR")}
                    {sale.dueDate ? ` · vence ${sale.dueDate.toLocaleDateString("pt-BR")}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-racing-muted">Mecânico: {sale.mechanic?.name || "sem mecânico"}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm text-racing-muted">
                    {sale.items.map((item) => <span key={item.id}>{item.quantity}x {item.description}</span>)}
                  </div>
                </div>
                <div className="min-w-48 text-left lg:text-right">
                  <strong className="text-2xl">{brl(sale.total)}</strong>
                  <form action={`/api/vendas/${sale.id}/pagar`} method="post" className="mt-3 space-y-2">
                    <select name="paymentMethod" className="h-10 rounded-lg px-3 text-sm">
                      <option>Pix</option>
                      <option>Dinheiro</option>
                      <option>Cartão de crédito</option>
                      <option>Cartão de débito</option>
                    </select>
                    <button className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-racing-red px-3 py-2 text-sm font-bold text-white">
                      <CheckCircle2 size={16} />
                      Finalizar pagamento
                    </button>
                  </form>
                </div>
              </div>
            </Card>
          ))}
          {!openSales.length ? <Card>Nenhuma venda a prazo em aberto.</Card> : null}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black">Quitadas recentemente</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {paidSales.map((sale) => (
              <Card key={sale.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{sale.client?.name || "Cliente não informado"}</p>
                    <p className="text-sm text-racing-muted">
                      Pago em {sale.paidAt?.toLocaleDateString("pt-BR") || "-"} · {sale.paymentMethod || "Recebido"}
                    </p>
                  </div>
                  <strong>{brl(sale.total)}</strong>
                </div>
              </Card>
            ))}
            {!paidSales.length ? <Card>Nenhuma venda quitada ainda.</Card> : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
