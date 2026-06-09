"use client";

import * as React from "react";
import { ChevronDown, Pencil, X } from "lucide-react";
import { ActionModal } from "@/components/ActionModal";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";

type EditableProduct = {
  id: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  barcode: string | null;
  qrCode: string | null;
  ncm: string | null;
  cfop: string | null;
  csosn: string | null;
  fiscalUnit: string | null;
  fiscalOrigin: string | null;
};

export function ProductStockActions({ product, canDelete }: { product: EditableProduct; canDelete: boolean }) {
  const [editing, setEditing] = React.useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          title="Editar produto"
          aria-label={`Editar ${product.name}`}
          onClick={() => setEditing(true)}
          className="grid h-10 w-10 place-items-center rounded-lg border border-racing-line bg-racing-panel text-racing-muted hover:bg-racing-soft hover:text-racing-red"
        >
          <Pencil size={17} />
        </button>
        {canDelete ? (
          <form action={`/api/produtos/${product.id}`} method="post">
            <input type="hidden" name="_method" value="delete" />
            <ConfirmSubmitButton
              message={`Excluir o produto "${product.name}"?`}
              title="Excluir produto"
              aria-label={`Excluir ${product.name}`}
              className="grid h-10 w-10 place-items-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
            >
              <X size={18} />
            </ConfirmSubmitButton>
          </form>
        ) : null}
      </div>

      <ActionModal
        open={editing}
        onClose={() => setEditing(false)}
        title="Editar produto"
        description="Atualize os dados do estoque."
        maxWidth="max-w-lg"
      >
            <form
              action={`/api/produtos/${product.id}`}
              method="post"
              data-reset-on-success="true"
              onSubmit={(event) => event.currentTarget.addEventListener("wsp:success", () => setEditing(false), { once: true })}
              className="mt-5 space-y-3"
            >
              <input type="hidden" name="_method" value="update" />
              <label className="block space-y-1.5 text-sm font-semibold">
                <span>Produto</span>
                <input name="name" required defaultValue={product.name} className="h-11 rounded-lg px-3" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5 text-sm font-semibold">
                  <span>Compra</span>
                  <input
                    name="buyPrice"
                    required
                    type="number"
                    step="0.01"
                    defaultValue={product.buyPrice}
                    className="h-11 rounded-lg px-3"
                  />
                </label>
                <label className="block space-y-1.5 text-sm font-semibold">
                  <span>Venda</span>
                  <input
                    name="sellPrice"
                    required
                    type="number"
                    step="0.01"
                    defaultValue={product.sellPrice}
                    className="h-11 rounded-lg px-3"
                  />
                </label>
              </div>
              <label className="block space-y-1.5 text-sm font-semibold">
                <span>Quantidade</span>
                <input
                  name="quantity"
                  required
                  type="number"
                  defaultValue={product.quantity}
                  className="h-11 rounded-lg px-3"
                />
              </label>
              <label className="block space-y-1.5 text-sm font-semibold">
                <span>Código de barras</span>
                <input name="barcode" defaultValue={product.barcode || ""} className="h-11 rounded-lg px-3" />
              </label>
              <label className="block space-y-1.5 text-sm font-semibold">
                <span>QR Code</span>
                <input name="qrCode" defaultValue={product.qrCode || ""} className="h-11 rounded-lg px-3" />
              </label>
              <details className="group rounded-lg border border-racing-line p-3">
                <summary className="flex min-h-8 cursor-pointer list-none items-center gap-2 text-sm font-black [&::-webkit-details-marker]:hidden">
                  <span>Dados fiscais</span>
                  <ChevronDown
                    size={18}
                    aria-hidden="true"
                    className="ml-auto shrink-0 text-racing-muted transition-transform duration-200 group-open:rotate-180"
                  />
                </summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1.5 text-sm font-semibold">
                    <span>NCM</span>
                    <input name="ncm" inputMode="numeric" defaultValue={product.ncm || ""} className="h-11 rounded-lg px-3" />
                  </label>
                  <label className="block space-y-1.5 text-sm font-semibold">
                    <span>CFOP</span>
                    <input name="cfop" inputMode="numeric" defaultValue={product.cfop || ""} className="h-11 rounded-lg px-3" />
                  </label>
                  <label className="block space-y-1.5 text-sm font-semibold">
                    <span>CSOSN</span>
                    <input name="csosn" inputMode="numeric" defaultValue={product.csosn || ""} className="h-11 rounded-lg px-3" />
                  </label>
                  <label className="block space-y-1.5 text-sm font-semibold">
                    <span>Unidade</span>
                    <input name="fiscalUnit" defaultValue={product.fiscalUnit || "UN"} className="h-11 rounded-lg px-3 uppercase" />
                  </label>
                  <label className="block space-y-1.5 text-sm font-semibold">
                    <span>Origem ICMS</span>
                    <input name="fiscalOrigin" inputMode="numeric" defaultValue={product.fiscalOrigin || "0"} className="h-11 rounded-lg px-3" />
                  </label>
                </div>
              </details>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-racing-line px-4 py-2 text-sm font-bold text-racing-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-racing-red px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
                >
                  Salvar alterações
                </button>
              </div>
            </form>
      </ActionModal>
    </>
  );
}
