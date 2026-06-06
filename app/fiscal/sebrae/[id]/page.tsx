import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, FileUp, ListChecks } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PrintButton } from "@/components/PrintButton";
import { SebraeGuideActions } from "@/components/SebraeGuideActions";
import { requirePageUser } from "@/lib/auth";
import { brl } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { sebraePortalUrl, type SebraeDraftPayload } from "@/lib/sebrae-fiscal";

function value(value?: string | null) {
  return value || "Não informado";
}

export default async function SebraeFiscalGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser();
  const document = await prisma.fiscalDocument.findFirst({
    where: { id, workspaceId: user.workspaceId, provider: "SEBRAE", type: "NFE" },
  });
  if (!document) notFound();

  const payload = document.payload as unknown as SebraeDraftPayload;
  if (!payload || payload.preparedFor !== "SEBRAE") notFound();
  const portalUrl = sebraePortalUrl(document.environment);
  const summary = [
    `NF-e da venda ${payload.sale.id}`,
    `Emitente: ${payload.issuer.companyName}`,
    `CNPJ: ${payload.issuer.cnpj}`,
    `IE: ${value(payload.issuer.stateRegistration)}`,
    `Destinatário: ${value(payload.recipient.name)}`,
    `CPF/CNPJ: ${value(payload.recipient.document)}`,
    "",
    "ITENS",
    ...payload.items.map((item, index) =>
      `${index + 1}. ${item.description} | ${item.quantity} ${item.unit} x ${brl(item.unitPrice)} | NCM ${item.ncm} | CFOP ${item.cfop} | CSOSN ${item.csosn} | Total ${brl(item.total)}`),
    "",
    `Total dos produtos: ${brl(payload.totals.products)}`,
    `Pagamento: ${value(payload.sale.paymentMethod)}`,
    ...payload.notes,
  ].join("\n");

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/fiscal" className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-racing-muted">
              <ArrowLeft size={16} />
              Voltar ao fiscal
            </Link>
            <h1 className="text-3xl font-black">Preparação da NF-e Sebrae</h1>
            <p className="text-sm text-racing-muted">Ficha de conferência para emissão gratuita no portal oficial.</p>
          </div>
          <Badge tone={document.status === "AUTHORIZED" ? "green" : "amber"}>
            {document.status === "AUTHORIZED" ? "XML importado" : "Rascunho"}
          </Badge>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
          <p className="flex items-center gap-2 font-black">
            <AlertTriangle size={18} />
            Emissão assistida
          </p>
          <p className="mt-1">
            O Sebrae não disponibiliza API pública. O WSP organiza e valida os dados; a assinatura e transmissão são feitas no Emissor Sebrae.
          </p>
          {document.environment !== "producao" ? (
            <p className="mt-2 font-bold">
              Esta ficha é de homologação e não possui validade fiscal. O botão abre a página oficial do Sebrae porque o endereço direto de testes está indisponível.
            </p>
          ) : null}
        </div>

        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black">
                <ListChecks size={19} />
                Etapas
              </h2>
              <p className="mt-1 text-sm text-racing-muted">Use produção somente para documentos com validade fiscal.</p>
            </div>
            <SebraeGuideActions summary={summary} portalUrl={portalUrl} />
          </div>
          <ol className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <li className="rounded-lg bg-racing-soft p-3"><strong>1.</strong> Copie ou imprima esta ficha.</li>
            <li className="rounded-lg bg-racing-soft p-3"><strong>2.</strong> Abra o Emissor Fiscal e escolha NF-e.</li>
            <li className="rounded-lg bg-racing-soft p-3"><strong>3.</strong> Confira, assine e transmita à SEFAZ.</li>
            <li className="rounded-lg bg-racing-soft p-3"><strong>4.</strong> Baixe o XML autorizado e importe abaixo.</li>
          </ol>
        </Card>

        <article id="sebrae-fiscal-guide" className="space-y-5">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">Dados da nota</h2>
              <Badge>{document.environment === "producao" ? "Produção" : "Homologação"}</Badge>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <section className="rounded-xl border border-racing-line p-4">
                <h3 className="font-black">Emitente</h3>
                <dl className="mt-3 grid grid-cols-[110px_1fr] gap-2 text-sm">
                  <dt className="text-racing-muted">Empresa</dt><dd className="font-semibold">{payload.issuer.companyName}</dd>
                  <dt className="text-racing-muted">CNPJ</dt><dd className="font-semibold">{payload.issuer.cnpj}</dd>
                  <dt className="text-racing-muted">IE</dt><dd className="font-semibold">{value(payload.issuer.stateRegistration)}</dd>
                  <dt className="text-racing-muted">Endereço</dt><dd className="font-semibold">{value(payload.issuer.address)}</dd>
                  <dt className="text-racing-muted">Contato</dt><dd className="font-semibold">{value(payload.issuer.phone)}</dd>
                </dl>
              </section>
              <section className="rounded-xl border border-racing-line p-4">
                <h3 className="font-black">Destinatário</h3>
                <dl className="mt-3 grid grid-cols-[110px_1fr] gap-2 text-sm">
                  <dt className="text-racing-muted">Nome</dt><dd className="font-semibold">{value(payload.recipient.name)}</dd>
                  <dt className="text-racing-muted">CPF/CNPJ</dt><dd className="font-semibold">{value(payload.recipient.document)}</dd>
                  <dt className="text-racing-muted">E-mail</dt><dd className="font-semibold">{value(payload.recipient.email)}</dd>
                  <dt className="text-racing-muted">Endereço</dt><dd className="font-semibold">{value(payload.recipient.address)}</dd>
                  <dt className="text-racing-muted">Contato</dt><dd className="font-semibold">{value(payload.recipient.phone)}</dd>
                </dl>
              </section>
            </div>

            <div className="mt-5 overflow-x-auto rounded-xl border border-racing-line">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-racing-soft text-xs uppercase text-racing-muted">
                  <tr>
                    <th className="px-3 py-3">Produto</th>
                    <th className="px-3 py-3">NCM</th>
                    <th className="px-3 py-3">CFOP</th>
                    <th className="px-3 py-3">CSOSN</th>
                    <th className="px-3 py-3">Origem</th>
                    <th className="px-3 py-3">Qtd.</th>
                    <th className="px-3 py-3">Unitário</th>
                    <th className="px-3 py-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {payload.items.map((item) => (
                    <tr key={item.code} className="border-t border-racing-line">
                      <td className="px-3 py-3 font-bold">{item.description}</td>
                      <td className="px-3 py-3">{item.ncm}</td>
                      <td className="px-3 py-3">{item.cfop}</td>
                      <td className="px-3 py-3">{item.csosn}</td>
                      <td className="px-3 py-3">{item.origin}</td>
                      <td className="px-3 py-3">{item.quantity} {item.unit}</td>
                      <td className="px-3 py-3">{brl(item.unitPrice)}</td>
                      <td className="px-3 py-3 font-black">{brl(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-racing-soft p-4 text-sm">
                <p>Pagamento: <strong>{value(payload.sale.paymentMethod)}</strong></p>
                <p className="mt-1">Data da venda: <strong>{new Date(payload.sale.createdAt).toLocaleString("pt-BR")}</strong></p>
              </div>
              <div className="rounded-xl bg-racing-soft p-4 text-right">
                <p className="text-sm text-racing-muted">Total dos produtos</p>
                <p className="text-2xl font-black">{brl(payload.totals.products)}</p>
              </div>
            </div>

            {payload.servicesExcluded.length ? (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <p className="font-black">Serviços fora da NF-e: {brl(payload.totals.servicesExcluded)}</p>
                <p className="mt-1">Emita estes itens separadamente como NFS-e.</p>
              </div>
            ) : null}

            <div className="mt-5">
              <PrintButton label="Imprimir ficha" targetId="sebrae-fiscal-guide" />
            </div>
          </Card>
        </article>

        <Card>
          <h2 className="flex items-center gap-2 text-lg font-black">
            {document.status === "AUTHORIZED" ? <CheckCircle2 size={19} /> : <FileUp size={19} />}
            {document.status === "AUTHORIZED" ? "NF-e autorizada arquivada" : "Importar XML autorizado"}
          </h2>
          {document.status === "AUTHORIZED" ? (
            <div className="mt-4">
              <a href={`/api/fiscal/sebrae/${document.id}/xml`} className="text-sm font-black text-racing-red">
                Baixar XML arquivado
              </a>
            </div>
          ) : (
            <form action={`/api/fiscal/sebrae/${document.id}/import`} method="post" encType="multipart/form-data" className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input name="xml" type="file" accept=".xml,application/xml,text/xml" required className="min-h-11 flex-1 rounded-lg border border-racing-line p-2 text-sm" />
              <Button type="submit">
                <FileUp size={17} />
                Importar XML
              </Button>
            </form>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
