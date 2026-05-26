import { CalendarDays, CheckCircle2, Plus, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { requirePageUser } from "@/lib/auth";
import { brl } from "@/lib/currency";
import { prisma } from "@/lib/prisma";

export default async function AgendamentosPage({ searchParams }: { searchParams: { error?: string } }) {
  const user = await requirePageUser();
  const [clients, motorcycles, mechanics, products, services, appointments] = await Promise.all([
    prisma.client.findMany({ where: { workspaceId: user.workspaceId }, orderBy: { name: "asc" } }),
    prisma.motorcycle.findMany({ where: { workspaceId: user.workspaceId }, include: { client: true }, orderBy: { plate: "asc" } }),
    prisma.user.findMany({ where: { workspaceId: user.workspaceId, isActive: true, isMechanic: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { workspaceId: user.workspaceId }, orderBy: { name: "asc" } }),
    prisma.service.findMany({ where: { workspaceId: user.workspaceId }, orderBy: { name: "asc" } }),
    prisma.appointment.findMany({
      where: { workspaceId: user.workspaceId },
      include: { client: true, motorcycle: true, mechanic: true, items: true },
      orderBy: { date: "asc" },
    }),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black">Agendamentos</h1>
          <p className="text-sm text-racing-muted">Planeje produção por mecânico e finalize gerando venda com baixa de estoque.</p>
        </div>
        {searchParams.error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{searchParams.error}</div> : null}

        <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
          <Card>
            <h2 className="flex items-center gap-2 text-lg font-black">
              <CalendarDays size={19} />
              Novo agendamento
            </h2>
            <form action="/api/agendamentos" method="post" className="mt-4 space-y-4">
              <select name="clientId" required className="h-11 rounded-lg px-3">
                <option value="">Cliente</option>
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
              <select name="mechanicId" className="h-11 rounded-lg px-3">
                <option value="">Mecânico responsável</option>
                {mechanics.map((mechanic) => <option key={mechanic.id} value={mechanic.id}>{mechanic.name}</option>)}
              </select>
              <input name="date" required type="datetime-local" className="h-11 rounded-lg px-3" />
              {[0, 1].map((index) => (
                <div key={`p-${index}`} className="grid grid-cols-[1fr_74px] gap-2">
                  <select name="productId" className="h-11 rounded-lg px-3">
                    <option value="">Produto previsto</option>
                    {products.map((product) => <option key={product.id} value={product.id}>{product.name} · {brl(product.sellPrice)}</option>)}
                  </select>
                  <input name="productQuantity" type="number" min={1} defaultValue={1} className="h-11 rounded-lg px-3" />
                </div>
              ))}
              {[0, 1].map((index) => (
                <div key={`s-${index}`} className="grid grid-cols-[1fr_74px] gap-2">
                  <select name="serviceId" className="h-11 rounded-lg px-3">
                    <option value="">Serviço previsto</option>
                    {services.map((service) => <option key={service.id} value={service.id}>{service.name} · {brl(service.price)}</option>)}
                  </select>
                  <input name="serviceQuantity" type="number" min={1} defaultValue={1} className="h-11 rounded-lg px-3" />
                </div>
              ))}
              <textarea name="notes" rows={3} className="rounded-lg px-3 py-2" placeholder="Observações" />
              <Button type="submit" className="w-full">
                <Plus size={17} />
                Agendar
              </Button>
            </form>
          </Card>

          <section className="space-y-3">
            {appointments.map((appointment) => (
              <Card key={appointment.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black">{appointment.client.name}</h2>
                      <Badge tone={appointment.status === "FINISHED" ? "green" : appointment.status === "CANCELLED" ? "red" : "amber"}>
                        {appointment.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-racing-muted">
                      {appointment.date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} · {appointment.motorcycle?.plate || "Sem moto"}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-sm text-racing-muted">
                      <UserRound size={14} />
                      {appointment.mechanic?.name || "Sem mecânico"}
                    </p>
                    <p className="mt-2 text-sm">{appointment.notes}</p>
                    <div className="mt-3 text-sm text-racing-muted">
                      {appointment.items.map((item) => (
                        <span key={item.id} className="mr-3 inline-block">{item.quantity}x {item.description}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <strong className="text-xl">{brl(appointment.total)}</strong>
                    {appointment.status !== "FINISHED" ? (
                      <form action={`/api/agendamentos/${appointment.id}/finalizar`} method="post" className="mt-3 space-y-2">
                        <select name="paymentMethod" className="h-10 rounded-lg px-3 text-sm">
                          <option>Pix</option>
                          <option>Dinheiro</option>
                          <option>Cartão de crédito</option>
                          <option>Cartão de débito</option>
                        </select>
                        <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-racing-red px-3 py-2 text-sm font-bold text-white">
                          <CheckCircle2 size={16} />
                          Finalizar e pagar
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))}
            {!appointments.length ? <Card>Nenhum agendamento cadastrado.</Card> : null}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
