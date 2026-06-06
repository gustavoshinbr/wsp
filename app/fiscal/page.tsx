import Link from "next/link";
import { ExternalLink, FileCheck2, FileUp, Settings2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FiscalReceiptComposer } from "@/components/FiscalReceiptComposer";
import { FiscalDefaultsButton } from "@/components/FiscalDefaultsButton";
import { requirePageUser } from "@/lib/auth";
import { brl } from "@/lib/currency";
import { prisma } from "@/lib/prisma";

export default async function FiscalPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const query = await searchParams;
  const user = await requirePageUser();
  const canConfigureFiscal = user.role === "OWNER" || user.role === "ADMIN";
  const fiscalStatusLabels: Record<string, string> = {
    DRAFT: "Rascunho",
    PROCESSING: "Processando",
    AUTHORIZED: "Autorizada",
    REJECTED: "Rejeitada",
    CANCELLED: "Cancelada",
    ERROR: "Erro",
  };
  const [config, clients, motorcycles, products, services, quotes, sales, documents] = await Promise.all([
    prisma.fiscalConfig.findUnique({ where: { workspaceId: user.workspaceId } }),
    prisma.client.findMany({ where: { workspaceId: user.workspaceId }, orderBy: { name: "asc" } }),
    prisma.motorcycle.findMany({ where: { workspaceId: user.workspaceId }, orderBy: { plate: "asc" } }),
    prisma.product.findMany({ where: { workspaceId: user.workspaceId }, orderBy: { name: "asc" } }),
    prisma.service.findMany({ where: { workspaceId: user.workspaceId }, orderBy: { name: "asc" } }),
    prisma.quote.findMany({
      where: { workspaceId: user.workspaceId },
      include: { client: true, motorcycle: true, items: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.sale.findMany({
      where: { workspaceId: user.workspaceId, paymentStatus: { not: "CANCELED" } },
      include: { client: true, motorcycle: true, items: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.fiscalDocument.findMany({
      where: { workspaceId: user.workspaceId },
      include: { sale: { include: { client: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const productOptions = products.map((product) => ({
    id: product.id,
    name: product.name,
    barcode: product.barcode,
    sellPrice: Number(product.sellPrice),
    quantity: product.quantity,
  }));
  const serviceOptions = services.map((service) => ({
    id: service.id,
    name: service.name,
    price: Number(service.price),
  }));
  const quoteOptions = quotes.map((quote) => ({
    id: quote.id,
    createdAt: quote.createdAt.toISOString(),
    total: Number(quote.total),
    client: { name: quote.client.name, phone: quote.client.phone },
    motorcycle: quote.motorcycle
      ? { plate: quote.motorcycle.plate, brand: quote.motorcycle.brand, model: quote.motorcycle.model }
      : null,
    items: quote.items.map((item) => ({
      id: item.id,
      type: item.type,
      description: item.description,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      total: Number(item.total),
    })),
  }));
  const saleOptions = sales.map((sale) => ({
    id: sale.id,
    createdAt: sale.createdAt.toISOString(),
    total: Number(sale.total),
    paymentMethod: sale.paymentMethod,
    client: sale.client ? { name: sale.client.name, phone: sale.client.phone } : null,
    motorcycle: sale.motorcycle
      ? { plate: sale.motorcycle.plate, brand: sale.motorcycle.brand, model: sale.motorcycle.model }
      : null,
    items: sale.items.map((item) => ({
      id: item.id,
      type: item.type,
      description: item.description,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      total: Number(item.total),
    })),
  }));
  const fiscalReady = String(config?.cnpj || user.workspace.document || "").replace(/\D/g, "").length === 14;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black">Fiscal e recibos</h1>
          <p className="text-sm text-racing-muted">Recibos térmicos e preparação de NF-e para emissão gratuita no Sebrae.</p>
        </div>
        {query.error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{query.error}</div> : null}
        {query.success ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
            {query.success === "sebrae-imported" ? "XML da NF-e autorizado e arquivado." : "Dados fiscais salvos."}
          </div>
        ) : null}
        {!fiscalReady ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
            O botão está disponível, mas a preparação só será concluída após cadastrar o CNPJ da oficina na configuração fiscal.
          </div>
        ) : null}

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">
          <strong>Emissão gratuita:</strong> o WSP prepara e valida os dados. A assinatura e transmissão são concluídas no{" "}
          <a href="https://sebrae.com.br/subsites/emissor-nf-e" target="_blank" rel="noreferrer" className="font-black underline">
            Emissor Sebrae
          </a>
          , que não cobra por nota. Conta Sebrae, credenciamento na SEFAZ e certificado digital são obrigatórios; o certificado pode ter custo externo.
        </div>

        {canConfigureFiscal ? (
          <Card>
            <details open={!config}>
            <summary className="flex cursor-pointer list-none items-center gap-2 text-lg font-black">
              <Settings2 size={19} />
              Configuração fiscal
            </summary>
            <form id="fiscal-config-form" action="/api/notas-fiscais" method="post" className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-1.5 text-sm font-bold sm:col-span-2">
                Nome da empresa
                <input name="companyName" required defaultValue={config?.companyName || user.workspace.workshopName} className="h-11 rounded-lg px-3" />
              </label>
              <label className="space-y-1.5 text-sm font-bold">
                CNPJ
                <input name="cnpj" required defaultValue={config?.cnpj || user.workspace.document} className="h-11 rounded-lg px-3" />
              </label>
              <label className="space-y-1.5 text-sm font-bold">
                Ambiente
                <select name="environment" defaultValue={config?.environment || "homologacao"} className="h-11 rounded-lg px-3">
                  <option value="homologacao">Homologação</option>
                  <option value="producao">Produção</option>
                </select>
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
              <div className="rounded-xl border border-racing-line bg-racing-soft p-4 sm:col-span-2 lg:col-span-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-black">Padrões fiscais sugeridos</p>
                    <p className="mt-1 text-xs font-semibold text-racing-muted">
                      Preenche CFOP 5102, CSOSN 102, UN, PIS/COFINS 49 e origem 0. O NCM depende de cada produto e deve ter 8 dígitos.
                    </p>
                  </div>
                  <FiscalDefaultsButton formId="fiscal-config-form" />
                </div>
              </div>
              <label className="space-y-1.5 text-sm font-bold">
                NCM padrão
                <input name="defaultNcm" inputMode="numeric" pattern="\d{8}" maxLength={8} defaultValue={config?.defaultNcm || ""} className="h-11 rounded-lg px-3" placeholder="8 dígitos" />
              </label>
              <label className="space-y-1.5 text-sm font-bold">
                CFOP padrão
                <input name="defaultCfop" inputMode="numeric" defaultValue={config?.defaultCfop || "5102"} className="h-11 rounded-lg px-3" />
              </label>
              <label className="space-y-1.5 text-sm font-bold">
                CSOSN padrão
                <input name="defaultCsosn" inputMode="numeric" defaultValue={config?.defaultCsosn || "102"} className="h-11 rounded-lg px-3" />
              </label>
              <label className="space-y-1.5 text-sm font-bold">
                Unidade padrão
                <input name="defaultUnit" defaultValue={config?.defaultUnit || "UN"} className="h-11 rounded-lg px-3 uppercase" />
              </label>
              <label className="space-y-1.5 text-sm font-bold">
                CST PIS
                <input name="defaultPisCst" inputMode="numeric" defaultValue={config?.defaultPisCst || "49"} className="h-11 rounded-lg px-3" />
              </label>
              <label className="space-y-1.5 text-sm font-bold">
                CST COFINS
                <input name="defaultCofinsCst" inputMode="numeric" defaultValue={config?.defaultCofinsCst || "49"} className="h-11 rounded-lg px-3" />
              </label>
              <label className="space-y-1.5 text-sm font-bold">
                Origem ICMS
                <input name="defaultOrigin" inputMode="numeric" defaultValue={config?.defaultOrigin || "0"} className="h-11 rounded-lg px-3" />
              </label>
              <div className="flex items-end">
                <Button type="submit" className="w-full">Salvar configuração</Button>
              </div>
            </form>
            <p className="mt-4 text-xs font-semibold text-racing-muted">
              Os códigos fiscais devem ser confirmados com a contabilidade. Homologação não gera documento com valor fiscal.
            </p>
            </details>
          </Card>
        ) : (
          <Card>
            <p className="font-black">Configuração fiscal</p>
            <p className="mt-1 text-sm text-racing-muted">
              Os dados fiscais são administrados pelo dono ou por um administrador da oficina.
            </p>
          </Card>
        )}

        <FiscalReceiptComposer
          clients={clients.map((client) => ({ id: client.id, name: client.name, phone: client.phone }))}
          motorcycles={motorcycles}
          products={productOptions}
          services={serviceOptions}
          quotes={quoteOptions}
          sales={saleOptions}
          workshopName={config?.companyName || user.workspace.workshopName}
          workshopDocument={config?.cnpj || user.workspace.document}
          workshopPhone={config?.phone || user.workspace.phone}
          workshopEmail={config?.email || user.workspace.email}
          workshopAddress={config?.address}
        />

        <Card>
          <h2 className="flex items-center gap-2 text-lg font-black">
            <FileCheck2 size={19} />
            Histórico fiscal
          </h2>
          <div className="mt-4 space-y-3">
            {documents.map((document) => {
              const tone = document.status === "AUTHORIZED" ? "green" : document.status === "REJECTED" || document.status === "ERROR" ? "red" : "amber";
              return (
                <div key={document.id} className="flex flex-col gap-3 rounded-lg border border-racing-line p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <strong>{document.type === "NFCE" ? "NFC-e" : "NF-e"} {document.number ? `#${document.number}` : `#${document.reference.slice(-8)}`}</strong>
                      <Badge tone={tone}>{fiscalStatusLabels[document.status] || document.status}</Badge>
                      <Badge>{document.environment === "producao" ? "Produção" : "Homologação"}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-racing-muted">
                      {document.sale?.client?.name || "Consumidor"} · {document.createdAt.toLocaleString("pt-BR")}
                      {document.sale ? ` · ${brl(document.sale.total)}` : ""}
                    </p>
                    {document.message ? <p className="mt-1 text-xs font-semibold text-racing-muted">{document.message}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {document.provider === "SEBRAE" ? (
                      <Link href={`/fiscal/sebrae/${document.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-racing-line px-3 text-sm font-bold">
                        Ficha Sebrae <ExternalLink size={15} />
                      </Link>
                    ) : null}
                    {document.provider === "SEBRAE" && document.status !== "AUTHORIZED" ? (
                      <form action={`/api/fiscal/sebrae/${document.id}/import`} method="post" encType="multipart/form-data" className="flex items-center gap-2">
                        <input
                          name="xml"
                          type="file"
                          accept=".xml,application/xml,text/xml"
                          required
                          aria-label="XML autorizado"
                          className="max-w-44 rounded-lg border border-racing-line p-2 text-xs"
                        />
                        <button type="submit" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-racing-red px-3 text-sm font-bold text-white">
                          <FileUp size={15} />
                          Importar
                        </button>
                      </form>
                    ) : null}
                    {document.danfeUrl ? (
                      <a href={document.danfeUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-racing-line px-3 text-sm font-bold">
                        {document.type === "NFCE" ? "DANFC-e" : "DANFE"} <ExternalLink size={15} />
                      </a>
                    ) : null}
                    {document.xmlUrl ? (
                      <a href={document.xmlUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-racing-line px-3 text-sm font-bold">
                        XML <ExternalLink size={15} />
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {!documents.length ? <p className="rounded-lg border border-dashed border-racing-line p-4 text-sm text-racing-muted">Nenhum documento transmitido.</p> : null}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
