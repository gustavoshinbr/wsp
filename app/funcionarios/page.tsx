import { ShieldCheck, UserCog, Wrench } from "lucide-react";
import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const roleLabels: Record<UserRole, string> = {
  OWNER: "Dono",
  ADMIN: "Administrador",
  STAFF: "Funcionário",
};

export default async function FuncionariosPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  const user = await requirePageUser();
  const canManage = user.role === "OWNER" || user.role === "ADMIN";
  const employees = await prisma.user.findMany({
    where: { workspaceId: user.workspaceId },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black">Funcionários</h1>
          <p className="text-sm text-racing-muted">Cadastre equipe da oficina, defina acesso e marque quem pode ser mecânico responsável.</p>
        </div>
        {query.error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{query.error}</div> : null}

        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <Card>
            <h2 className="flex items-center gap-2 text-lg font-black">
              <UserCog size={19} />
              Novo funcionário
            </h2>
            {canManage ? (
              <form action="/api/funcionarios" method="post" className="mt-4 space-y-3">
                <input name="name" required className="h-11 rounded-lg px-3" placeholder="Nome completo" />
                <input name="email" required type="email" className="h-11 rounded-lg px-3" placeholder="email@oficina.com" />
                <input name="phone" className="h-11 rounded-lg px-3" placeholder="Telefone" />
                <input name="password" required type="password" minLength={8} className="h-11 rounded-lg px-3" placeholder="Senha inicial" />
                <select name="role" defaultValue="STAFF" className="h-11 rounded-lg px-3">
                  <option value="STAFF">Funcionário</option>
                  {user.role === "OWNER" ? <option value="ADMIN">Administrador</option> : null}
                </select>
                <input name="specialty" className="h-11 rounded-lg px-3" placeholder="Especialidade: motor, elétrica, revisão..." />
                <input name="commissionPercent" type="number" step="0.01" min="0" className="h-11 rounded-lg px-3" placeholder="Comissão % opcional" />
                <label className="flex items-center gap-2 rounded-lg border border-racing-line bg-racing-soft p-3 text-sm font-bold">
                  <input name="isMechanic" type="checkbox" className="h-4 w-4" />
                  Pode ser mecânico responsável
                </label>
                <Button type="submit" className="w-full">Cadastrar funcionário</Button>
              </form>
            ) : (
              <p className="mt-4 text-sm text-racing-muted">Seu perfil pode consultar a equipe, mas não cadastrar funcionários.</p>
            )}
          </Card>

          <section className="grid gap-3">
            {employees.map((employee) => (
              <Card key={employee.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black">{employee.name}</h2>
                      <Badge tone={employee.isActive ? "green" : "red"}>{employee.isActive ? "Ativo" : "Inativo"}</Badge>
                      <Badge tone={employee.role === "OWNER" ? "red" : "zinc"}>
                        <ShieldCheck size={13} className="mr-1" />
                        {roleLabels[employee.role]}
                      </Badge>
                      {employee.isMechanic ? (
                        <Badge tone="amber">
                          <Wrench size={13} className="mr-1" />
                          Mecânico
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-racing-muted">{employee.email} · {employee.phone || "sem telefone"}</p>
                    <p className="mt-2 text-sm text-racing-muted">
                      {employee.specialty || "Sem especialidade"} {employee.commissionPercent ? `· comissão ${employee.commissionPercent}%` : ""}
                    </p>
                  </div>

                  {canManage &&
                  (user.role === "OWNER" || employee.role === "STAFF" || employee.id === user.id) ? (
                    <form action={`/api/funcionarios/${employee.id}`} method="post" className="grid gap-2 lg:w-[360px]">
                      <div className="grid grid-cols-2 gap-2">
                        <input name="name" defaultValue={employee.name} className="h-10 rounded-lg px-3 text-sm" />
                        <input name="phone" defaultValue={employee.phone || ""} className="h-10 rounded-lg px-3 text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          name="role"
                          defaultValue={employee.role}
                          className="h-10 rounded-lg px-3 text-sm"
                          disabled={employee.role === "OWNER" || employee.id === user.id}
                        >
                          <option value="OWNER">Dono</option>
                          <option value="ADMIN">Administrador</option>
                          <option value="STAFF">Funcionário</option>
                        </select>
                        <input name="password" type="password" minLength={8} className="h-10 rounded-lg px-3 text-sm" placeholder="Nova senha opcional" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input name="specialty" defaultValue={employee.specialty || ""} className="h-10 rounded-lg px-3 text-sm" placeholder="Especialidade" />
                        <input name="commissionPercent" defaultValue={employee.commissionPercent ? String(employee.commissionPercent) : ""} type="number" step="0.01" className="h-10 rounded-lg px-3 text-sm" placeholder="Comissão %" />
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm font-bold text-racing-muted">
                        <label className="flex items-center gap-2">
                          <input name="isActive" type="checkbox" defaultChecked={employee.isActive} className="h-4 w-4" />
                          Ativo
                        </label>
                        <label className="flex items-center gap-2">
                          <input name="isMechanic" type="checkbox" defaultChecked={employee.isMechanic} className="h-4 w-4" />
                          Mecânico
                        </label>
                      </div>
                      <button className="rounded-lg border border-racing-line px-3 py-2 text-sm font-bold">Salvar alterações</button>
                    </form>
                  ) : null}
                </div>
              </Card>
            ))}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
