import { Bike, Plus, Search, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ClientActions } from "@/components/ClientActions";
import { DataTable } from "@/components/DataTable";
import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ q?: string; error?: string }> }) {
  const query = await searchParams;
  const user = await requirePageUser();
  const q = query.q?.trim();
  const documentQuery = q?.replace(/\D/g, "") || "";
  const clients = await prisma.client.findMany({
    where: {
      workspaceId: user.workspaceId,
      ...(q
        ? {
            OR: [
                { name: { contains: q, mode: "insensitive" } },
                { phone: { contains: q } },
                ...(documentQuery ? [{ document: { contains: documentQuery } }] : []),
                { email: { contains: q, mode: "insensitive" } },
              { motorcycles: { some: { plate: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    include: { motorcycles: true },
    orderBy: { createdAt: "desc" },
  });
  const editableClient = (client: (typeof clients)[number]) => ({
    id: client.id,
    name: client.name,
    phone: client.phone,
    document: client.document,
    email: client.email,
    address: client.address,
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black">Clientes</h1>
          <p className="text-sm text-racing-muted">Cadastre clientes, motos e busque por nome, telefone ou placa.</p>
        </div>
        {query.error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{query.error}</div> : null}

        <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
          <Card>
            <h2 className="text-lg font-black">Novo cliente</h2>
            <form action="/api/clientes" method="post" className="mt-4 space-y-3">
              <input name="name" required className="h-11 rounded-lg px-3" placeholder="Nome completo" />
              <input name="phone" required className="h-11 rounded-lg px-3" placeholder="Telefone" />
              <div className="grid gap-3 sm:grid-cols-2">
                <input name="document" inputMode="numeric" className="h-11 rounded-lg px-3" placeholder="CPF ou CNPJ" />
                <input name="email" type="email" className="h-11 rounded-lg px-3" placeholder="E-mail para NF-e" />
              </div>
              <input name="address" className="h-11 rounded-lg px-3" placeholder="Endereço" />
              <div className="grid gap-3 sm:grid-cols-2">
                <input name="plate" className="h-11 rounded-lg px-3" placeholder="Placa" />
                <input name="model" className="h-11 rounded-lg px-3" placeholder="Modelo" />
                <input name="brand" className="h-11 rounded-lg px-3" placeholder="Marca" />
                <input name="year" className="h-11 rounded-lg px-3" placeholder="Ano" />
              </div>
              <input name="color" className="h-11 rounded-lg px-3" placeholder="Cor" />
              <Button type="submit" className="w-full">
                <Plus size={17} />
                Salvar cliente
              </Button>
            </form>
          </Card>

          <section className="space-y-4">
            <form className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-racing-muted" size={17} />
              <input name="q" defaultValue={q} className="h-11 rounded-lg pl-10 pr-3" placeholder="Buscar cliente, telefone ou placa" />
            </form>

            <DataTable
              data={clients}
              getKey={(client) => client.id}
              emptyTitle="Nenhum cliente cadastrado"
              columns={[
                {
                  header: "Cliente",
                  render: (client) => (
                    <div>
                      <p className="font-black">{client.name}</p>
                      <p className="text-sm text-racing-muted">{client.phone}</p>
                      {client.document ? <p className="text-xs text-racing-muted">{client.document}</p> : null}
                    </div>
                  ),
                },
                {
                  header: "Motos",
                  render: (client) => client.motorcycles.map((motorcycle) => motorcycle.plate).join(", ") || "-",
                },
                {
                  header: "Ações",
                  className: "w-28",
                  render: (client) => <ClientActions client={editableClient(client)} />,
                },
              ]}
              mobileRender={(client) => (
                <Card>
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-racing-soft text-racing-muted">
                      <UserRound size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-black">{client.name}</p>
                      <p className="text-sm text-racing-muted">{client.phone}</p>
                      <p className="mt-2 flex items-center gap-1 text-sm">
                        <Bike size={15} />
                        {client.motorcycles.length} moto(s)
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <ClientActions client={editableClient(client)} />
                  </div>
                </Card>
              )}
            />

            <Card>
              <h2 className="font-black">Adicionar moto a cliente existente</h2>
              <form action="/api/clientes" method="post" className="mt-4 grid gap-3 md:grid-cols-6">
                <select name="clientId" required className="h-11 rounded-lg px-3 md:col-span-2">
                  <option value="">Cliente</option>
                  {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                </select>
                <input name="plate" required className="h-11 rounded-lg px-3" placeholder="Placa" />
                <input name="model" className="h-11 rounded-lg px-3" placeholder="Modelo" />
                <input name="brand" className="h-11 rounded-lg px-3" placeholder="Marca" />
                <Button type="submit">Adicionar</Button>
              </form>
            </Card>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
