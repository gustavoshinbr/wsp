import Link from "next/link";
import { AlertTriangle, CalendarDays, Package, ShoppingCart, Wrench } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { StatCard } from "@/components/StatCard";
import { requirePageUser } from "@/lib/auth";
import { brl } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { subscriptionMessage } from "@/lib/subscription";

export default async function DashboardPage() {
  const user = await requirePageUser();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const [salesToday, appointmentsToday, lowStock, latestSales, nextAppointments] = await Promise.all([
    prisma.sale.findMany({ where: { workspaceId: user.workspaceId, createdAt: { gte: start, lte: end } }, include: { items: true } }),
    prisma.appointment.count({ where: { workspaceId: user.workspaceId, date: { gte: start, lte: end }, status: "SCHEDULED" } }),
    prisma.product.findMany({ where: { workspaceId: user.workspaceId, quantity: { lte: 3 } }, take: 5, orderBy: { quantity: "asc" } }),
    prisma.sale.findMany({ where: { workspaceId: user.workspaceId }, include: { client: true }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.appointment.findMany({
      where: { workspaceId: user.workspaceId, status: "SCHEDULED", date: { gte: new Date() } },
      include: { client: true, motorcycle: true },
      orderBy: { date: "asc" },
      take: 5,
    }),
  ]);

  const totalToday = salesToday.reduce((sum, sale) => sum + Number(sale.total), 0);
  const servicesToday = salesToday.reduce(
    (sum, sale) => sum + sale.items.filter((item) => item.serviceId || item.type === "SERVICE").length,
    0,
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black">Inicio</h1>
            <p className="text-sm text-racing-muted">{subscriptionMessage(user.workspace)}</p>
          </div>
          <Link
            href="/vendas"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-racing-red px-5 py-2 text-sm font-bold text-white hover:bg-red-700"
          >
            <ShoppingCart size={18} />
            Nova venda
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Serviços do dia" value={servicesToday} helper="Itens de serviço vendidos hoje" icon={Wrench} tone="green" />
          <StatCard title="Valor total do dia" value={brl(totalToday)} helper={`${salesToday.length} venda(s) concluída(s)`} icon={ShoppingCart} />
          <StatCard title="Agendamentos" value={appointmentsToday} helper="Compromissos marcados para hoje" icon={CalendarDays} tone="amber" />
          <StatCard title="Baixo estoque" value={lowStock.length} helper="Produtos com 3 unidades ou menos" icon={Package} tone="red" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">Últimas vendas</h2>
              <Link href="/vendas" className="text-sm font-bold text-racing-red">Ver vendas</Link>
            </div>
            <div className="mt-4 divide-y divide-racing-line">
              {latestSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-bold">{sale.client?.name || "Venda avulsa"}</p>
                    <p className="text-xs text-racing-muted">{sale.createdAt.toLocaleDateString("pt-BR")}</p>
                  </div>
                  <strong>{brl(sale.total)}</strong>
                </div>
              ))}
              {!latestSales.length ? <p className="py-6 text-sm text-racing-muted">Nenhuma venda registrada ainda.</p> : null}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">Próximos agendamentos</h2>
              <Link href="/agendamentos" className="text-sm font-bold text-racing-red">Ver agenda</Link>
            </div>
            <div className="mt-4 divide-y divide-racing-line">
              {nextAppointments.map((appointment) => (
                <div key={appointment.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold">{appointment.client.name}</p>
                    <Badge tone="amber">{appointment.date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</Badge>
                  </div>
                  <p className="text-sm text-racing-muted">{appointment.motorcycle?.plate || "Sem moto vinculada"}</p>
                </div>
              ))}
              {!nextAppointments.length ? <p className="py-6 text-sm text-racing-muted">Nenhum agendamento futuro.</p> : null}
            </div>
          </Card>
        </div>

        <Card>
          <div className="flex items-center gap-2">
            <AlertTriangle size={19} className="text-racing-red" />
            <h2 className="text-lg font-black">Produtos com baixo estoque</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lowStock.map((product) => (
              <div key={product.id} className="rounded-lg border border-racing-line bg-racing-soft p-3">
                <p className="font-bold">{product.name}</p>
                <p className="text-sm text-racing-muted">Restam {product.quantity} unidade(s)</p>
              </div>
            ))}
            {!lowStock.length ? <p className="text-sm text-racing-muted">Nenhum produto em alerta.</p> : null}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
