"use client";

import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { CartBuilder, CartSummary } from "@/components/CartBuilder";
import { QuotePreview } from "@/components/QuotePreview";
import { brl } from "@/lib/currency";

export function QuoteComposer({
  clients,
  motorcycles,
  products,
  services,
  workshopName,
  workshopPhone,
  workshopEmail,
}: {
  clients: Array<{ id: string; name: string; phone: string }>;
  motorcycles: Array<{ id: string; plate: string; brand: string | null; model: string | null; clientId: string }>;
  products: Array<{ id: string; name: string; barcode: string | null; sellPrice: number; quantity: number }>;
  services: Array<{ id: string; name: string; price: number }>;
  workshopName: string;
  workshopPhone?: string | null;
  workshopEmail?: string | null;
}) {
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || "");
  const [selectedMotorcycleId, setSelectedMotorcycleId] = useState("");
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<CartSummary>({ rows: [], laborDescription: "", laborValue: "" });

  const selectedClient = clients.find((client) => client.id === selectedClientId) || clients[0];
  const clientMotorcycles = motorcycles.filter((motorcycle) => motorcycle.clientId === selectedClientId);
  const selectedMotorcycle = clientMotorcycles.find((motorcycle) => motorcycle.id === selectedMotorcycleId) || null;

  useEffect(() => {
    if (selectedMotorcycleId && !clientMotorcycles.some((motorcycle) => motorcycle.id === selectedMotorcycleId)) {
      setSelectedMotorcycleId("");
    }
  }, [clientMotorcycles, selectedMotorcycleId]);

  const draftItems = useMemo(() => {
    const items = cart.rows
      .map((row, index) => {
        const quantity = Math.max(1, Number(row.quantity) || 1);
        const product = products.find((item) => item.id === row.productId);
        const service = services.find((item) => item.id === row.serviceId);

        if (row.type === "product" && product) {
          return {
            id: `${row.id}-${index}`,
            description: product.name,
            quantity,
            unitPrice: product.sellPrice,
            total: product.sellPrice * quantity,
          };
        }

        if (row.type === "service" && service) {
          return {
            id: `${row.id}-${index}`,
            description: service.name,
            quantity,
            unitPrice: service.price,
            total: service.price * quantity,
          };
        }

        if (row.type === "quickProduct") {
          const price = Number(row.quickProductUnitPrice || 0);
          if (!row.quickProductName.trim() || price <= 0) return null;
          return {
            id: `${row.id}-${index}`,
            description: row.quickProductName,
            quantity,
            unitPrice: price,
            total: price * quantity,
          };
        }

        return null;
      })
      .filter(Boolean) as Array<{
      id: string;
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;

    const laborValue = Number(String(cart.laborValue || "0").replace(",", "."));
    if (cart.laborDescription.trim() && laborValue > 0) {
      items.push({
        id: "draft-labor",
        description: `Mão de obra: ${cart.laborDescription.trim()}`,
        quantity: 1,
        unitPrice: laborValue,
        total: laborValue,
      });
    }
    return items;
  }, [cart, products, services]);

  const previewQuote = useMemo(
    () => ({
      id: "draft",
      status: "DRAFT",
      total: draftItems.reduce((sum, item) => sum + item.total, 0),
      notes,
      createdAt: new Date(),
      client: selectedClient
        ? { name: selectedClient.name, phone: selectedClient.phone }
        : { name: "Cliente", phone: "-" },
      motorcycle: selectedMotorcycle
        ? {
            plate: selectedMotorcycle.plate,
            brand: selectedMotorcycle.brand,
            model: selectedMotorcycle.model,
          }
        : null,
      items: draftItems,
    }),
    [draftItems, notes, selectedClient, selectedMotorcycle],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <Card>
        <form action="/api/orcamentos" method="post" className="space-y-4">
          <div>
            <p className="text-sm font-black uppercase text-racing-red">Emissão rápida</p>
            <h2 className="mt-1 text-2xl font-black">Montar orçamento</h2>
            <p className="mt-1 text-sm text-racing-muted">Selecione cliente, moto e itens para salvar e gerar o documento.</p>
          </div>

          {clients.length ? (
            <label className="block space-y-1.5 text-sm font-bold">
              <span>Cliente</span>
              <select
                name="clientId"
                required
                value={selectedClientId}
                onChange={(event) => setSelectedClientId(event.target.value)}
                className="h-11 w-full rounded-lg px-3"
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
              Cadastre um cliente antes de criar o orçamento.{" "}
              <Link href="/clientes" className="font-black underline">
                Ir para clientes
              </Link>
            </div>
          )}

          <label className="block space-y-1.5 text-sm font-bold">
            <span>Moto</span>
            <select
              name="motorcycleId"
              value={selectedMotorcycleId}
              onChange={(event) => setSelectedMotorcycleId(event.target.value)}
              className="h-11 w-full rounded-lg px-3"
            >
              <option value="">Sem moto vinculada</option>
              {clientMotorcycles.map((motorcycle) => (
                <option key={motorcycle.id} value={motorcycle.id}>
                  {motorcycle.plate} - {[motorcycle.brand, motorcycle.model].filter(Boolean).join(" ")}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5 text-sm font-bold">
            <span>Observações</span>
            <textarea
              name="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-24 w-full rounded-lg px-3 py-2"
              placeholder="Validade, condições e observações"
            />
          </label>

          <CartBuilder products={products} services={services} onChange={setCart} />

          <div className="rounded-lg border border-racing-line bg-racing-panel p-3">
            <p className="text-sm font-black">Total do orçamento</p>
            <p className="mt-1 text-3xl font-black">{brl(previewQuote.total)}</p>
          </div>

          <Button type="submit" className="w-full" disabled={!clients.length || !draftItems.length}>
            <Plus size={17} />
            Salvar orçamento
          </Button>
        </form>
      </Card>

      <Card className="h-fit">
        <div>
          <p className="flex items-center gap-2 text-sm font-black uppercase text-racing-red">
            <FileText size={16} />
            Prévia
          </p>
          <h2 className="mt-1 text-2xl font-black">Documento de orçamento</h2>
        </div>
        <div className="mt-4">
          <QuotePreview
            quote={previewQuote}
            workshopName={workshopName}
            workshopPhone={workshopPhone}
            workshopEmail={workshopEmail}
            disablePdf={!draftItems.length}
          />
        </div>
      </Card>
    </div>
  );
}
