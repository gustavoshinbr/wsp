import Link from "next/link";
import { CalendarClock, CheckCircle2, UserRound, Wrench } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { StatCard } from "@/components/StatCard";
import { appointmentStatusLabel } from "@/lib/appointment-status";
import { requirePageUser } from "@/lib/auth";
import { brl } from "@/lib/currency";
import { prisma } from "@/lib/prisma";

export default async function ProducaoPage() {
  const user = await requirePageUser();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const [mechanics, todayAppointments, openAppointments, finishedToday] = await Promise.all([
    prisma.user.findMany({ where: { workspaceId: user.workspaceId, isActive: true, isMechanic: true }, orderBy: { name: "asc" } }),
    prisma.appointment.findMany({
      where: { workspaceId: user.workspaceId, date: { gte: start, lte: end } },
      include: { client: true, motorcycle: true, mechanic: true, items: true },
      orderBy: { date: "asc" },
    }),
    prisma.appointment.count({ where: { workspaceId: user.workspaceId, status: "SCHEDULED" } }),
    prisma.appointment.count({ where: { workspaceId: user.workspaceId, status: "FINISHED", updatedAt: { gte: start, lte: end } } }),
  ]);

  const byMechanic = mechanics.map((mechanic) => ({
    mechanic,
    appointments: todayAppointments.filter((appointment) => appointment.mechanicId === mechanic.id),
  }));
  const unassigned = todayAppointments.filter((appointment) => !appointment.mechanicId);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black">Produção</h1>
            <p className="text-sm text-racing-muted">Fila da oficina por mecânico, serviços do dia e agendamentos em aberto.</p>
          </div>
          <Link href="/agendamentos" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-racing-red px-4 py-2 text-sm font-bold text-white">
            <CalendarClock size={17} />
            Abrir agenda
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Serviços hoje" value={todayAppointments.length} icon={Wrench} />
          <StatCard title="Em aberto" value={openAppointments} icon={CalendarClock} tone="amber" />
          <StatCard title="Finalizados hoje" value={finishedToday} icon={CheckCircle2} tone="green" />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {byMechanic.map(({ mechanic, appointments }) => (
            <Card key={mechanic.id}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-black">
                    <UserRound size={18} />
                    {mechanic.name}
                  </h2>
                  <p className="text-sm text-racing-muted">{mechanic.specialty || "Mecânico geral"}</p>
                </div>
                <Badge tone={appointments.length ? "amber" : "green"}>{appointments.length} serviço(s)</Badge>
              </div>
              <div className="mt-4 divide-y divide-racing-line">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{appointment.client.name}</p>
                        <p className="text-sm text-racing-muted">
                          {appointment.date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {appointment.motorcycle?.plate || "Sem moto"}
                        </p>
                      </div>
                      <Badge tone={appointment.status === "FINISHED" ? "green" : "amber"}>{appointmentStatusLabel(appointment.status)}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-racing-muted">
                      {appointment.items.map((item) => `${item.quantity}x ${item.description}`).join(" · ") || "Sem itens previstos"}
                    </p>
                    <p className="mt-1 text-sm font-bold">{brl(appointment.total)}</p>
                  </div>
                ))}
                {!appointments.length ? <p className="py-5 text-sm text-racing-muted">Sem serviços para hoje.</p> : null}
              </div>
            </Card>
          ))}
          <Card>
            <h2 className="text-lg font-black">Sem mecânico definido</h2>
            <div className="mt-4 divide-y divide-racing-line">
              {unassigned.map((appointment) => (
                <div key={appointment.id} className="py-3">
                  <p className="font-black">{appointment.client.name}</p>
                  <p className="text-sm text-racing-muted">
                    {appointment.date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {appointment.motorcycle?.plate || "Sem moto"}
                  </p>
                </div>
              ))}
              {!unassigned.length ? <p className="py-5 text-sm text-racing-muted">Tudo com responsável definido.</p> : null}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
