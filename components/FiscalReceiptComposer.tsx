"use client";

import { AlertTriangle, CheckCircle2, FileCheck2, Loader2, PlugZap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { CartBuilder, CartSummary } from "@/components/CartBuilder";
import { PrintButton } from "@/components/PrintButton";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { brl } from "@/lib/currency";
import { whatsappUrl } from "@/lib/whatsapp";

type ReceiptItem = {
  id: string;
  type: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type ReceiptSource = {
  id: string;
  createdAt: string;
  total: number;
  paymentMethod?: string | null;
  client: { name: string; phone: string } | null;
  motorcycle: { plate: string; brand: string | null; model: string | null } | null;
  items: ReceiptItem[];
};

export function FiscalReceiptComposer({
  clients,
  motorcycles,
  products,
  services,
  quotes,
  sales,
  workshopName,
  workshopDocument,
  workshopPhone,
  workshopEmail,
  workshopAddress,
  fiscalConfigured,
}: {
  clients: Array<{ id: string; name: string; phone: string }>;
  motorcycles: Array<{ id: string; plate: string; brand: string | null; model: string | null; clientId: string }>;
  products: Array<{ id: string; name: string; barcode: string | null; sellPrice: number; quantity: number }>;
  services: Array<{ id: string; name: string; price: number }>;
  quotes: ReceiptSource[];
  sales: ReceiptSource[];
  workshopName: string;
  workshopDocument?: string | null;
  workshopPhone?: string | null;
  workshopEmail?: string | null;
  workshopAddress?: string | null;
  fiscalConfigured: boolean;
}) {
  const initialMode = sales.length ? "sale" : quotes.length ? "quote" : "manual";
  const [mode, setMode] = useState<"manual" | "quote" | "sale">(initialMode);
  const [selectedSourceId, setSelectedSourceId] = useState(sales[0]?.id || quotes[0]?.id || "");
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || "");
  const [selectedMotorcycleId, setSelectedMotorcycleId] = useState("");
  const [cart, setCart] = useState<CartSummary>({ rows: [], laborDescription: "", laborValue: "" });
  const [testing, setTesting] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error" | "info"; message: string } | null>(null);
  const router = useRouter();
  const stableId = useId().replace(/:/g, "");
  const thermalId = `receipt-${stableId}`;

  const sources = mode === "sale" ? sales : quotes;
  const selectedSource = sources.find((source) => source.id === selectedSourceId) || sources[0] || null;
  const selectedClient = clients.find((client) => client.id === selectedClientId) || null;
  const clientMotorcycles = motorcycles.filter((motorcycle) => motorcycle.clientId === selectedClientId);
  const selectedMotorcycle = clientMotorcycles.find((motorcycle) => motorcycle.id === selectedMotorcycleId) || null;

  const manualItems = useMemo(() => {
    const items = cart.rows
      .map((row, index) => {
        const quantity = Math.max(1, Number(row.quantity) || 1);
        const product = products.find((item) => item.id === row.productId);
        const service = services.find((item) => item.id === row.serviceId);

        if (row.type === "product" && product) {
          return {
            id: `manual-product-${index}`,
            type: "PRODUCT",
            description: product.name,
            quantity,
            unitPrice: product.sellPrice,
            total: product.sellPrice * quantity,
          };
        }
        if (row.type === "service" && service) {
          return {
            id: `manual-service-${index}`,
            type: "SERVICE",
            description: service.name,
            quantity,
            unitPrice: service.price,
            total: service.price * quantity,
          };
        }
        if (row.type === "quickProduct") {
          const unitPrice = Number(row.quickProductUnitPrice || 0);
          if (!row.quickProductName.trim() || unitPrice <= 0) return null;
          return {
            id: `manual-quick-${index}`,
            type: "MANUAL",
            description: row.quickProductName,
            quantity,
            unitPrice,
            total: unitPrice * quantity,
          };
        }
        return null;
      })
      .filter(Boolean) as ReceiptItem[];

    const laborValue = Number(String(cart.laborValue || "0").replace(",", "."));
    if (cart.laborDescription.trim() && laborValue > 0) {
      items.push({
        id: "manual-labor",
        type: "SERVICE",
        description: `Mão de obra: ${cart.laborDescription.trim()}`,
        quantity: 1,
        unitPrice: laborValue,
        total: laborValue,
      });
    }
    return items;
  }, [cart, products, services]);

  const receipt = mode === "manual"
    ? {
        id: stableId,
        createdAt: new Date().toISOString(),
        paymentMethod: null,
        client: selectedClient ? { name: selectedClient.name, phone: selectedClient.phone } : null,
        motorcycle: selectedMotorcycle,
        items: manualItems,
        total: manualItems.reduce((sum, item) => sum + item.total, 0),
      }
    : selectedSource;

  const motorcycleLabel = receipt?.motorcycle
    ? `${receipt.motorcycle.plate} ${[receipt.motorcycle.brand, receipt.motorcycle.model].filter(Boolean).join(" ")}`
    : "-";
  const receiptMessage = receipt
    ? [
        `Comprovante da ${workshopName}`,
        receipt.client?.name ? `Cliente: ${receipt.client.name}` : "",
        receipt.motorcycle ? `Moto: ${motorcycleLabel}` : "",
        "",
        ...receipt.items.map((item) => `${item.quantity}x ${item.description}: ${brl(item.total)}`),
        "",
        `Total: ${brl(receipt.total)}`,
        "Comprovante sem valor fiscal.",
      ].filter(Boolean).join("\n")
    : "";

  function selectMode(nextMode: "manual" | "quote" | "sale") {
    setMode(nextMode);
    setFeedback(null);
    if (nextMode === "sale") setSelectedSourceId(sales[0]?.id || "");
    if (nextMode === "quote") setSelectedSourceId(quotes[0]?.id || "");
  }

  async function testIntegration() {
    setTesting(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/fiscal/status", { cache: "no-store" });
      const body = await response.json();
      setFeedback({
        tone: response.ok && body.connected ? "success" : "error",
        message: body.nfceEnabled === false
          ? `${body.message} A NFC-e ainda não está habilitada para este CNPJ.`
          : body.message,
      });
    } catch {
      setFeedback({ tone: "error", message: "Não foi possível testar a conexão fiscal." });
    } finally {
      setTesting(false);
    }
  }

  async function issueNfce() {
    if (mode !== "sale" || !selectedSource) return;
    setIssuing(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/fiscal/nfce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saleId: selectedSource.id }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Falha na emissão.");

      const excluded = Number(body.servicesExcluded || 0);
      setFeedback({
        tone: body.ok ? "success" : "info",
        message: body.ok
          ? `NFC-e autorizada${body.document?.number ? `, número ${body.document.number}` : ""}.${excluded ? ` ${excluded} item(ns) de serviço não foram incluídos.` : ""}`
          : body.document?.message || "Documento enviado para processamento.",
      });
      router.refresh();
    } catch (error) {
      setFeedback({ tone: "error", message: error instanceof Error ? error.message : "Falha na emissão." });
    } finally {
      setIssuing(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
      <Card>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-black uppercase text-racing-red">Comprovante e NFC-e</p>
            <h2 className="mt-1 text-2xl font-black">Cupom da venda</h2>
            <p className="mt-1 text-sm text-racing-muted">
              Gere um recibo térmico ou transmita as mercadorias de uma venda para a Focus NFe.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {(["sale", "quote", "manual"] as const).map((value) => (
              <button
                key={value}
                type="button"
                className={`min-h-10 rounded-lg px-3 text-sm font-black ${mode === value ? "bg-racing-red text-white" : "border border-racing-line text-racing-muted"}`}
                onClick={() => selectMode(value)}
              >
                {value === "manual" ? "Manual" : value === "quote" ? "Orçamento" : "Venda"}
              </button>
            ))}
          </div>

          {mode === "manual" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5 text-sm font-bold">
                  <span>Cliente</span>
                  <select value={selectedClientId} onChange={(event) => setSelectedClientId(event.target.value)} className="h-11 rounded-lg px-3">
                    <option value="">Consumidor não identificado</option>
                    {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                  </select>
                </label>
                <label className="block space-y-1.5 text-sm font-bold">
                  <span>Moto</span>
                  <select value={selectedMotorcycleId} onChange={(event) => setSelectedMotorcycleId(event.target.value)} className="h-11 rounded-lg px-3">
                    <option value="">Sem moto</option>
                    {clientMotorcycles.map((motorcycle) => (
                      <option key={motorcycle.id} value={motorcycle.id}>{motorcycle.plate} - {motorcycle.model}</option>
                    ))}
                  </select>
                </label>
              </div>
              <CartBuilder products={products} services={services} onChange={setCart} />
            </>
          ) : (
            <label className="block space-y-1.5 text-sm font-bold">
              <span>{mode === "sale" ? "Venda" : "Orçamento"}</span>
              <select value={selectedSource?.id || ""} onChange={(event) => setSelectedSourceId(event.target.value)} className="h-11 rounded-lg px-3">
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    #{source.id.slice(-6).toUpperCase()} - {source.client?.name || "Consumidor"} - {brl(source.total)}
                  </option>
                ))}
              </select>
              {!sources.length ? <span className="block text-xs text-amber-600">Nenhum registro disponível.</span> : null}
            </label>
          )}

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="flex items-center gap-2 font-black">
              <AlertTriangle size={17} />
              Recibo não é nota fiscal
            </p>
            <p className="mt-1">
              A impressão abaixo é um comprovante. A NFC-e válida só existe após autorização da SEFAZ.
            </p>
          </div>

          {feedback ? (
            <div className={`rounded-lg border p-3 text-sm font-semibold ${
              feedback.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : feedback.tone === "error"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-blue-200 bg-blue-50 text-blue-800"
            }`}>
              {feedback.message}
            </div>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" variant="outline" onClick={testIntegration} disabled={testing}>
              {testing ? <Loader2 size={17} className="animate-spin" /> : <PlugZap size={17} />}
              Testar API fiscal
            </Button>
            <Button
              type="button"
              onClick={issueNfce}
              disabled={mode !== "sale" || !selectedSource || issuing || !fiscalConfigured}
              title={!fiscalConfigured ? "Configure FOCUS_NFE_TOKEN na Vercel" : undefined}
            >
              {issuing ? <Loader2 size={17} className="animate-spin" /> : <FileCheck2 size={17} />}
              Emitir NFC-e
            </Button>
          </div>
        </div>
      </Card>

      <Card className="h-fit">
        <div>
          <p className="text-sm font-black uppercase text-racing-red">Prévia térmica</p>
          <h2 className="mt-1 text-2xl font-black">Recibo de cupom</h2>
        </div>

        <article id={thermalId} className="mt-4 rounded-lg border border-racing-line bg-white p-4 font-mono text-xs text-slate-900">
          <div className="text-center">
            <p className="text-sm font-black">{workshopName}</p>
            {workshopDocument ? <p>CNPJ: {workshopDocument}</p> : null}
            {workshopAddress ? <p>{workshopAddress}</p> : null}
            {workshopPhone ? <p>Tel: {workshopPhone}</p> : null}
            {workshopEmail ? <p>{workshopEmail}</p> : null}
            <p className="mt-2 font-black">COMPROVANTE NÃO FISCAL</p>
          </div>
          <div className="mt-3 border-t border-dashed border-slate-400 pt-3">
            <p>Documento: #{receipt?.id.slice(-8).toUpperCase() || "-"}</p>
            <p>Data: {receipt ? new Date(receipt.createdAt).toLocaleString("pt-BR") : "-"}</p>
            <p>Cliente: {receipt?.client?.name || "Consumidor não identificado"}</p>
            <p>Moto: {motorcycleLabel}</p>
            {receipt?.paymentMethod ? <p>Pagamento: {receipt.paymentMethod}</p> : null}
          </div>
          <div className="mt-3 space-y-2 border-t border-dashed border-slate-400 pt-3">
            {receipt?.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{item.description}</p>
                  <p>{item.quantity} x {brl(item.unitPrice)}</p>
                </div>
                <p className="font-bold">{brl(item.total)}</p>
              </div>
            ))}
            {!receipt?.items.length ? <p className="text-center text-slate-500">Adicione itens ao comprovante.</p> : null}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-dashed border-slate-400 pt-3 text-sm font-black">
            <span>Total</span>
            <span>{brl(receipt?.total || 0)}</span>
          </div>
          <p className="mt-4 text-center text-[10px]">Obrigado pela preferência.</p>
        </article>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <PrintButton label="Imprimir recibo" targetId={thermalId} format="receipt" />
          <WhatsAppButton
            href={whatsappUrl(receipt?.client?.phone, receiptMessage)}
            label="Enviar recibo"
          />
        </div>

        {receipt?.items.length ? (
          <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <CheckCircle2 size={15} />
            Prévia pronta para impressão.
          </p>
        ) : null}
      </Card>
    </div>
  );
}
