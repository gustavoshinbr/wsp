import { FileText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function FiscalPage({ searchParams }: { searchParams: { error?: string; success?: string } }) {
  const user = await requirePageUser();
  const config = await prisma.fiscalConfig.findUnique({ where: { workspaceId: user.workspaceId } });

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-black">Fiscal</h1>
          <p className="text-sm text-racing-muted">Configurações fiscais preparadas para integração futura.</p>
        </div>
        {searchParams.error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{searchParams.error}</div> : null}
        {searchParams.success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">Dados fiscais salvos.</div> : null}

        <Card>
          <form action="/api/notas-fiscais" method="post" className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-bold sm:col-span-2">
              Nome da empresa
              <input name="companyName" required defaultValue={config?.companyName || user.workspace.workshopName} className="h-11 rounded-lg px-3" />
            </label>
            <label className="space-y-1.5 text-sm font-bold">
              CNPJ
              <input name="cnpj" required defaultValue={config?.cnpj || user.workspace.document} className="h-11 rounded-lg px-3" />
            </label>
            <label className="space-y-1.5 text-sm font-bold">
              Inscrição Estadual
              <input name="stateRegistration" defaultValue={config?.stateRegistration || ""} className="h-11 rounded-lg px-3" />
            </label>
            <label className="space-y-1.5 text-sm font-bold">
              Inscrição Municipal
              <input name="municipalRegistration" defaultValue={config?.municipalRegistration || ""} className="h-11 rounded-lg px-3" />
            </label>
            <label className="space-y-1.5 text-sm font-bold">
              Telefone
              <input name="phone" defaultValue={config?.phone || user.workspace.phone || ""} className="h-11 rounded-lg px-3" />
            </label>
            <label className="space-y-1.5 text-sm font-bold">
              Email
              <input name="email" type="email" defaultValue={config?.email || user.workspace.email} className="h-11 rounded-lg px-3" />
            </label>
            <label className="space-y-1.5 text-sm font-bold sm:col-span-2">
              Endereço
              <input name="address" defaultValue={config?.address || ""} className="h-11 rounded-lg px-3" />
            </label>
            <Button type="submit">Salvar dados fiscais</Button>
          </form>
        </Card>

        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black">
                <FileText size={19} />
                Emitir nota fiscal
              </h2>
              <p className="mt-1 text-sm text-racing-muted">Emissão fiscal preparada para integração futura com API fiscal.</p>
            </div>
            <button className="min-h-11 rounded-lg border border-racing-line px-4 py-2 text-sm font-bold text-racing-muted" type="button">
              Emitir nota fiscal
            </button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
