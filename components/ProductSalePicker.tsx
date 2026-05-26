"use client";

import { ScanLine } from "lucide-react";
import { useMemo, useState } from "react";
import { brl } from "@/lib/currency";

type ProductOption = {
  id: string;
  name: string;
  barcode: string | null;
  sellPrice: number;
  quantity: number;
};

export function ProductSalePicker({ products, index }: { products: ProductOption[]; index: number }) {
  const [barcode, setBarcode] = useState("");
  const [productId, setProductId] = useState("");
  const selectedProduct = useMemo(() => products.find((product) => product.id === productId), [productId, products]);

  function searchBarcode(value: string) {
    setBarcode(value);
    const found = products.find((product) => product.barcode && product.barcode === value.trim());
    if (found) setProductId(found.id);
  }

  return (
    <div className="rounded-lg border border-racing-line bg-racing-soft p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-racing-muted">
        <ScanLine size={14} />
        Produto {index + 1}
      </div>
      <input type="hidden" name="productId" value={productId} />
      <div className="grid gap-2 sm:grid-cols-[1fr_90px]">
        <input
          value={barcode}
          onChange={(event) => searchBarcode(event.target.value)}
          className="h-11 rounded-lg px-3"
          placeholder="Bipe ou digite o código de barras"
          inputMode="numeric"
        />
        <input name="productQuantity" type="number" min={1} defaultValue={1} className="h-11 rounded-lg px-3" />
      </div>
      <select value={productId} onChange={(event) => setProductId(event.target.value)} className="mt-2 h-11 rounded-lg px-3">
        <option value="">Selecionar manualmente</option>
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name} · {brl(product.sellPrice)} · qtd {product.quantity}
          </option>
        ))}
      </select>
      {selectedProduct ? (
        <p className="mt-2 text-xs font-semibold text-racing-muted">
          Selecionado: {selectedProduct.name} · código {selectedProduct.barcode || "sem código"}
        </p>
      ) : null}
    </div>
  );
}
