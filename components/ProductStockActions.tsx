"use client";

import * as React from "react";
import { Pencil, X } from "lucide-react";

type EditableProduct = {
  id: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  barcode: string | null;
  qrCode: string | null;
};

export function ProductStockActions({ product }: { product: EditableProduct }) {
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
        <form action={`/api/produtos/${product.id}`} method="post">
          <input type="hidden" name="_method" value="delete" />
          <button
            type="submit"
            title="Excluir produto"
            aria-label={`Excluir ${product.name}`}
            className="grid h-10 w-10 place-items-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
          >
            <X size={18} />
          </button>
        </form>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-racing-line bg-racing-panel p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">Editar produto</h2>
                <p className="text-sm text-racing-muted">Atualize os dados do estoque.</p>
              </div>
              <button
                type="button"
                aria-label="Fechar edicao"
                onClick={() => setEditing(false)}
                className="grid h-10 w-10 place-items-center rounded-lg border border-racing-line text-racing-muted"
              >
                <X size={18} />
              </button>
            </div>

            <form action={`/api/produtos/${product.id}`} method="post" className="mt-5 space-y-3">
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
                <span>Codigo de barras</span>
                <input name="barcode" defaultValue={product.barcode || ""} className="h-11 rounded-lg px-3" />
              </label>
              <label className="block space-y-1.5 text-sm font-semibold">
                <span>QR Code</span>
                <input name="qrCode" defaultValue={product.qrCode || ""} className="h-11 rounded-lg px-3" />
              </label>

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
                  Salvar alteracoes
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
