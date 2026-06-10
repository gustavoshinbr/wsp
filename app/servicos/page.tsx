import { Plus, Search, Wrench } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DataTable } from "@/components/DataTable";
import { ServiceActions } from "@/components/ServiceActions";
import { requirePageUser } from "@/lib/auth";
import { brl } from "@/lib/currency";
import { prisma } from "@/lib/prisma";

export default async function ServicosPage({ searchParams }: { searchParams: Promise<{ q?: string; error?: string }> }) {
  const query = await searchParams;
  const user = await requirePageUser();
  const q = query.q?.trim();
  const services = await prisma.service.findMany({
    where: { workspaceId: user.workspaceId, ...(q ? { name: { contains: q, mode: "insensitive" } } : {}) },
    orderBy: { createdAt: "desc" },
  });
  const editableService = (service: (typeof services)[number]) => ({
    id: service.id,
    name: service.name,
    price: Number(service.price),
    description: service.description,
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black">Serviços</h1>
          <p className="text-sm text-racing-muted">Cadastre mão de obra com valor fixo e descrição.</p>
        </div>
        {query.error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{query.error}</div> : null}

        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <Card>
            <h2 className="text-lg font-black">Novo serviço</h2>
            <form action="/api/servicos" method="post" className="mt-4 space-y-3" autoComplete="off">
              <input name="name" required autoComplete="off" className="h-11 rounded-lg px-3" placeholder="Nome do serviço" />
              <input name="price" required type="number" step="0.01" autoComplete="off" className="h-11 rounded-lg px-3" placeholder="Valor fixo" />
              <textarea name="description" rows={4} autoComplete="off" className="rounded-lg px-3 py-2" placeholder="Descrição" />
              <Button type="submit" className="w-full">
                <Plus size={17} />
                Salvar serviço
              </Button>
            </form>
          </Card>

          <section className="space-y-4">
            <form className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-racing-muted" size={17} />
              <input name="q" defaultValue={q} className="h-11 rounded-lg pl-10 pr-3" placeholder="Buscar serviço" />
            </form>
            <DataTable
              data={services}
              getKey={(service) => service.id}
              emptyTitle="Nenhum serviço cadastrado"
              columns={[
                { header: "Serviço", render: (service) => <strong>{service.name}</strong> },
                { header: "Valor", render: (service) => brl(service.price) },
                {
                  header: "Ações",
                  className: "w-28",
                  render: (service) => <ServiceActions service={editableService(service)} canDelete={user.role !== "STAFF"} />,
                },
              ]}
              mobileRender={(service) => (
                <Card>
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-racing-soft text-racing-muted">
                      <Wrench size={18} />
                    </span>
                    <div>
                      <p className="font-black">{service.name}</p>
                      <p className="text-sm text-racing-muted">{brl(service.price)}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <ServiceActions service={editableService(service)} canDelete={user.role !== "STAFF"} />
                  </div>
                </Card>
              )}
            />
          </section>
        </div>
      </div>
    </AppShell>
  );
}
