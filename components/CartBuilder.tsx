"use client";

import { Boxes, PackagePlus, Plus, Search, Trash2, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { brl } from "@/lib/currency";
import { cn } from "@/lib/utils";

type ProductOption = {
  id: string;
  name: string;
  barcode: string | null;
  sellPrice: number;
  quantity: number;
};

type ServiceOption = {
  id: string;
  name: string;
  price: number;
};

type RowType = "product" | "service" | "quickProduct";

export type CartRow = {
  id: number;
  type: RowType;
  productId: string;
  serviceId: string;
  barcode: string;
  quickProductName: string;
  quickProductUnitPrice: string;
  quantity: string;
};

export type CartSummary = {
  rows: CartRow[];
  laborDescription: string;
  laborValue: string;
};

const typeLabels: Record<RowType, string> = {
  product: "Estoque",
  service: "Serviço",
  quickProduct: "Criar produto",
};

function emptyRow(id: number): CartRow {
  return {
    id,
    type: "product",
    productId: "",
    serviceId: "",
    barcode: "",
    quickProductName: "",
    quickProductUnitPrice: "",
    quantity: "1",
  };
}

function moneyValue(value: string) {
  const parsed = Number(String(value || "0").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function CartBuilder({
  products,
  services,
  onChange,
}: {
  products: ProductOption[];
  services: ServiceOption[];
  onChange?: (summary: CartSummary) => void;
}) {
  const [nextId, setNextId] = useState(1);
  const [rows, setRows] = useState<CartRow[]>([emptyRow(0)]);
  const [laborDescription, setLaborDescription] = useState("");
  const [laborValue, setLaborValue] = useState("");

  useEffect(() => {
    onChange?.({ rows, laborDescription, laborValue });
  }, [laborDescription, laborValue, onChange, rows]);

  function updateRow(id: number, patch: Partial<CartRow>) {
    setRows((currentRows) =>
      currentRows.map((row) => {
        if (row.id !== id) return row;
        const typeChanged = patch.type && patch.type !== row.type;
        return {
          ...row,
          ...(typeChanged
            ? {
                productId: "",
                serviceId: "",
                barcode: "",
                quickProductName: "",
                quickProductUnitPrice: "",
              }
            : {}),
          ...patch,
        };
      }),
    );
  }

  function addRow() {
    setRows((currentRows) => [...currentRows, emptyRow(nextId)]);
    setNextId((currentId) => currentId + 1);
  }

  function removeRow(id: number) {
    setRows((currentRows) => (currentRows.length > 1 ? currentRows.filter((row) => row.id !== id) : currentRows));
  }

  function searchBarcode(row: CartRow, value: string) {
    const found = products.find((product) => product.barcode && product.barcode === value.trim());
    updateRow(row.id, { barcode: value, productId: found?.id || row.productId });
  }

  const previewTotal = useMemo(() => {
    const itemsTotal = rows.reduce((sum, row) => {
        const quantity = Math.max(1, Number(row.quantity) || 1);
        const product = products.find((item) => item.id === row.productId);
        const service = services.find((item) => item.id === row.serviceId);
        const unitPrice =
          row.type === "product"
            ? product?.sellPrice || 0
            : row.type === "service"
              ? service?.price || 0
              : moneyValue(row.quickProductUnitPrice);

        return sum + quantity * unitPrice;
      }, 0);
    return itemsTotal + moneyValue(laborValue);
  }, [laborValue, products, rows, services]);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-racing-line bg-racing-soft p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-black">
              <Boxes size={16} className="text-racing-red" />
              Carrinho
            </p>
          </div>
          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-racing-red px-3 text-sm font-black text-white"
            onClick={addRow}
          >
            <Plus size={16} />
            Adicionar item
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {rows.map((row, index) => {
            const selectedProduct = products.find((product) => product.id === row.productId);
            const selectedService = services.find((service) => service.id === row.serviceId);
            const quantity = Math.max(1, Number(row.quantity) || 1);
            const unitPrice =
              row.type === "product"
                ? selectedProduct?.sellPrice || 0
                : row.type === "service"
                  ? selectedService?.price || 0
                  : moneyValue(row.quickProductUnitPrice);

            return (
              <div key={row.id} className="rounded-lg border border-racing-line bg-racing-panel p-2 sm:p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black uppercase text-racing-muted">Item {index + 1}</span>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-racing-line text-racing-muted"
                    onClick={() => removeRow(row.id)}
                    title="Remover item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="mt-3 grid gap-2">
                  <div className="grid grid-cols-3 gap-1 rounded-lg border border-racing-line bg-racing-soft p-1">
                    {(Object.keys(typeLabels) as RowType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={cn(
                          "min-h-9 rounded-md px-2 text-xs font-black",
                          row.type === type ? "bg-racing-red text-white" : "text-racing-muted",
                        )}
                        onClick={() => updateRow(row.id, { type })}
                      >
                        {typeLabels[type]}
                      </button>
                    ))}
                  </div>

                  {row.type === "product" ? (
                    <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(220px,1fr)_86px]">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-racing-muted" size={16} />
                        <input
                          value={row.barcode}
                          onChange={(event) => searchBarcode(row, event.target.value)}
                          className="h-11 rounded-lg pl-9 pr-3"
                          placeholder="Bipe ou digite código"
                          inputMode="numeric"
                        />
                      </div>
                      <select
                        name="productId"
                        value={row.productId}
                        onChange={(event) => updateRow(row.id, { productId: event.target.value })}
                        className="h-11 rounded-lg px-3"
                      >
                        <option value="">Produto do estoque</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - {brl(product.sellPrice)} - qtd {product.quantity}
                          </option>
                        ))}
                      </select>
                      <input
                        name="productQuantity"
                        type="number"
                        min={1}
                        value={row.quantity}
                        onChange={(event) => updateRow(row.id, { quantity: event.target.value })}
                        className="h-11 rounded-lg px-3"
                        placeholder="Qtd"
                      />
                    </div>
                  ) : null}

                  {row.type === "service" ? (
                    <div className="grid gap-2 sm:grid-cols-[1fr_92px]">
                      <select
                        name="serviceId"
                        value={row.serviceId}
                        onChange={(event) => updateRow(row.id, { serviceId: event.target.value })}
                        className="h-11 rounded-lg px-3"
                      >
                        <option value="">Serviço cadastrado</option>
                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name} - {brl(service.price)}
                          </option>
                        ))}
                      </select>
                      <input
                        name="serviceQuantity"
                        type="number"
                        min={1}
                        value={row.quantity}
                        onChange={(event) => updateRow(row.id, { quantity: event.target.value })}
                        className="h-11 rounded-lg px-3"
                        placeholder="Qtd"
                      />
                    </div>
                  ) : null}

                  {row.type === "quickProduct" ? (
                    <div className="grid gap-2 sm:grid-cols-[1fr_86px_110px]">
                      <input
                        name="quickProductName"
                        value={row.quickProductName}
                        onChange={(event) => updateRow(row.id, { quickProductName: event.target.value })}
                        className="h-11 rounded-lg px-3"
                        placeholder="Nome do produto"
                      />
                      <input
                        name="quickProductQuantity"
                        type="number"
                        min={1}
                        value={row.quantity}
                        onChange={(event) => updateRow(row.id, { quantity: event.target.value })}
                        className="h-11 rounded-lg px-3"
                        placeholder="Qtd"
                      />
                      <input
                        name="quickProductUnitPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.quickProductUnitPrice}
                        onChange={(event) => updateRow(row.id, { quickProductUnitPrice: event.target.value })}
                        className="h-11 rounded-lg px-3"
                        placeholder="Venda"
                      />
                      <input type="hidden" name="quickProductBuyPrice" value="0" />
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between rounded-lg bg-racing-soft px-3 py-2 text-xs font-bold text-racing-muted">
                    <span>{unitPrice > 0 ? `${quantity} x ${brl(unitPrice)}` : "Selecione ou informe o valor"}</span>
                    <strong className="text-racing-text">{brl(quantity * unitPrice)}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-racing-line bg-racing-soft p-3">
        <p className="flex items-center gap-2 text-sm font-black">
          <Wrench size={16} className="text-racing-red" />
          Mão de obra manual
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_130px]">
          <input
            name="laborDescription"
            value={laborDescription}
            onChange={(event) => setLaborDescription(event.target.value)}
            className="h-11 rounded-lg px-3"
            placeholder="Descrição da mão de obra"
          />
          <input
            name="laborValue"
            value={laborValue}
            onChange={(event) => setLaborValue(event.target.value)}
            type="number"
            step="0.01"
            min="0"
            className="h-11 rounded-lg px-3"
            placeholder="Valor"
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-racing-line bg-racing-panel px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-black text-racing-muted">
          <PackagePlus size={16} />
          Parcial dos itens
        </span>
        <strong className="text-xl">{brl(previewTotal)}</strong>
      </div>
    </div>
  );
}
