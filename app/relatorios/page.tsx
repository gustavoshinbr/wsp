import Link from "next/link";
import { endOfDay, endOfMonth, format, startOfDay, startOfMonth, subDays } from "date-fns";
import { BarChart3, MessageCircle, Printer, TrendingUp, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/Card";
import { PrintButton } from "@/components/PrintButton";
import { StatCard } from "@/components/StatCard";
import { requirePageUser } from "@/lib/auth";
import { brl } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { whatsappUrl } from "@/lib/whatsapp";

function periodRange(period?: string, from?: string, to?: string) {
  const now = new Date();
  if (period === "7d") return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
  if (period === "month") return { from: startOfMonth(now), to: endOfMonth(now) };
  if (period === "custom" && from && to) return { from: startOfDay(new Date(from)), to: endOfDay(new Date(to)) };
  return { from: startOfDay(now), to: endOfDay(now) };
}

export default async function RelatoriosPage({ searchParams }: { searchParams: Promise<{ period?: string; from?: string; to?: string }> }) {
  const query = await searchParams;
  const user = await requirePageUser();
  const range = periodRange(query.period, query.from, query.to);
  const sales = await prisma.sale.findMany({
    where: { workspaceId: user.workspaceId, createdAt: { gte: range.from, lte: range.to } },
    include: { client: true, items: { include: { product: true, service: true } } },
    orderBy: { createdAt: "desc" },
  });

  const total = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const servicesCount = sales.reduce(
    (sum, sale) => sum + sale.items.filter((item) => item.serviceId || item.type === "SERVICE").length,
    0,
  );
  const clientsCount = new Set(sales.map((sale) => sale.clientId).filter(Boolean)).size;
  const profit = sales.reduce(
    (sum, sale) =>
      sum +
      sale.items.reduce((subtotal, item) => {
        if (item.product) return subtotal + (Number(item.unitPrice) - Number(item.product.buyPrice)) * item.quantity;
        return subtotal + Number(item.total);
      }, 0),
    0,
  );

  const products = new Map<string, { name: string; quantity: number; total: number }>();
  for (const sale of sales) {
    for (const item of sale.items) {
      if (!item.productId) continue;
      const current = products.get(item.productId) || { name: item.description, quantity: 0, total: 0 };
      current.quantity += item.quantity;
      current.total += Number(item.total);
      products.set(item.productId, current);
    }
  }
  const topProducts = [...products.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  const summary = `Resumo WSP Racing\nPeríodo: ${format(range.from, "dd/MM/yyyy")} a ${format(range.to, "dd/MM/yyyy")}\nTotal vendido: ${brl(total)}\nVendas: ${sales.length}\nServiços: ${servicesCount}\nLucro estimado: ${brl(profit)}`;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black">Relatórios</h1>
            <p className="text-sm text-racing-muted">Faturamento, vendas, produtos, clientes e lucro bruto estimado.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrintButton label="Exportar HTML/PDF" />
            <Link href={whatsappUrl(user.workspace.phone, summary)} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white">
              <MessageCircle size={17} />
              Enviar resumo
            </Link>
          </div>
        </div>

        <Card className="no-print">
          <form className="grid gap-3 sm:grid-cols-5">
            <select name="period" defaultValue={query.period || "today"} className="h-11 rounded-lg px-3">
              <option value="today">Hoje</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="month">Mês atual</option>
              <option value="custom">Personalizado</option>
            </select>
            <input name="from" type="date" defaultValue={query.from} className="h-11 rounded-lg px-3" />
            <input name="to" type="date" defaultValue={query.to} className="h-11 rounded-lg px-3" />
            <button className="rounded-lg bg-racing-red px-4 py-2 text-sm font-bold text-white sm:col-span-2">Aplicar filtros</button>
          </form>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total vendido" value={brl(total)} icon={TrendingUp} tone="green" />
          <StatCard title="Vendas" value={sales.length} icon={BarChart3} />
          <StatCard title="Serviços" value={servicesCount} icon={Printer} tone="amber" />
          <StatCard title="Clientes atendidos" value={clientsCount} icon={Users} tone="zinc" />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <h2 className="text-lg font-black">Resumo financeiro</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-racing-soft p-4">
                <p className="text-sm text-racing-muted">Lucro estimado</p>
                <strong className="text-2xl">{brl(profit)}</strong>
              </div>
              <div className="rounded-lg bg-racing-soft p-4">
                <p className="text-sm text-racing-muted">Ticket médio</p>
                <strong className="text-2xl">{brl(sales.length ? total / sales.length : 0)}</strong>
              </div>
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-black">Produtos mais vendidos</h2>
            <div className="mt-4 divide-y divide-racing-line">
              {topProducts.map((product) => (
                <div key={product.name} className="flex justify-between gap-3 py-3">
                  <span>{product.name}</span>
                  <strong>{product.quantity} un · {brl(product.total)}</strong>
                </div>
              ))}
              {!topProducts.length ? <p className="py-4 text-sm text-racing-muted">Sem produtos vendidos no período.</p> : null}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
