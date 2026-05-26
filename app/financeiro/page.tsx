import Link from "next/link";
import { CreditCard, DollarSign, ReceiptText, TrendingUp, Users } from "lucide-react";
import { startOfMonth, endOfMonth } from "date-fns";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/Card";
import { StatCard } from "@/components/StatCard";
import { requirePageUser } from "@/lib/auth";
import { brl } from "@/lib/currency";
import { prisma } from "@/lib/prisma";

export default async function FinanceiroPage() {
  const user = await requirePageUser();
  const from = startOfMonth(new Date());
  const to = endOfMonth(new Date());

  const sales = await prisma.sale.findMany({
    where: { workspaceId: user.workspaceId, createdAt: { gte: from, lte: to } },
    include: { mechanic: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });

  const revenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const productCost = sales.reduce(
    (sum, sale) =>
      sum +
      sale.items.reduce((subtotal, item) => {
        if (!item.product) return subtotal;
        return subtotal + Number(item.product.buyPrice) * item.quantity;
      }, 0),
    0,
  );
  const laborRevenue = sales.reduce(
    (sum, sale) =>
      sum +
      sale.items.reduce((subtotal, item) => {
        if (item.type === "SERVICE" && !item.productId) return subtotal + Number(item.total);
        return subtotal;
      }, 0),
    0,
  );
  const grossProfit = revenue - productCost;
  const byPayment = new Map<string, number>();
  const byMechanic = new Map<string, { name: string; total: number; commission: number }>();

  for (const sale of sales) {
    const payment = sale.paymentMethod || "Não informado";
    byPayment.set(payment, (byPayment.get(payment) || 0) + Number(sale.total));
    if (sale.mechanic) {
      const current = byMechanic.get(sale.mechanic.id) || { name: sale.mechanic.name, total: 0, commission: 0 };
      current.total += Number(sale.total);
      current.commission += Number(sale.total) * (Number(sale.mechanic.commissionPercent || 0) / 100);
      byMechanic.set(sale.mechanic.id, current);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black">Financeiro</h1>
            <p className="text-sm text-racing-muted">Receita, lucro bruto, mão de obra e comissões do mês atual.</p>
          </div>
          <Link href="/relatorios" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-racing-red px-4 py-2 text-sm font-bold text-white">
            <ReceiptText size={17} />
            Relatórios completos
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Faturamento" value={brl(revenue)} icon={DollarSign} tone="green" />
          <StatCard title="Lucro bruto" value={brl(grossProfit)} icon={TrendingUp} />
          <StatCard title="Mão de obra" value={brl(laborRevenue)} icon={Users} tone="amber" />
          <StatCard title="Vendas no mês" value={sales.length} icon={CreditCard} tone="zinc" />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <h2 className="text-lg font-black">Recebimento por forma de pagamento</h2>
            <div className="mt-4 divide-y divide-racing-line">
              {[...byPayment.entries()].map(([payment, total]) => (
                <div key={payment} className="flex items-center justify-between gap-3 py-3">
                  <span className="font-semibold">{payment}</span>
                  <strong>{brl(total)}</strong>
                </div>
              ))}
              {!byPayment.size ? <p className="py-5 text-sm text-racing-muted">Sem vendas no mês.</p> : null}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-black">Produção por mecânico</h2>
            <div className="mt-4 divide-y divide-racing-line">
              {[...byMechanic.values()].map((mechanic) => (
                <div key={mechanic.name} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{mechanic.name}</span>
                    <strong>{brl(mechanic.total)}</strong>
                  </div>
                  <p className="text-sm text-racing-muted">Comissão estimada: {brl(mechanic.commission)}</p>
                </div>
              ))}
              {!byMechanic.size ? <p className="py-5 text-sm text-racing-muted">Nenhuma venda com mecânico responsável.</p> : null}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
