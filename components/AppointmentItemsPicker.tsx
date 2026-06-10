"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { brl } from "@/lib/currency";

type Product = {
  id: string;
  name: string;
  sellPrice: number;
};

type Service = {
  id: string;
  name: string;
  price: number;
};

type Row = {
  id: number;
  type: "PRODUCT" | "SERVICE";
  itemId: string;
  quantity: number;
};

type AppointmentItemsPickerProps = {
  products: Product[];
  services: Service[];
};

export function AppointmentItemsPicker({ products, services }: AppointmentItemsPickerProps) {
  const [rows, setRows] = useState<Row[]>([
    { id: Date.now(), type: "PRODUCT", itemId: "", quantity: 1 },
  ]);

  const handleAddRow = () => {
    setRows((current) => [
      ...current,
      { id: Date.now() + Math.random(), type: "PRODUCT", itemId: "", quantity: 1 },
    ]);
  };

  const handleRemoveRow = (id: number) => {
    setRows((current) => current.filter((row) => row.id !== id));
  };

  const handleRowChange = (id: number, next: Partial<Row>) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...next } : row)),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black">Produtos e serviços previstos</h2>
        <button
          type="button"
          onClick={handleAddRow}
          className="inline-flex items-center gap-2 rounded-lg bg-racing-soft px-3 py-2 text-sm font-bold text-racing-text hover:bg-racing-panel"
        >
          <Plus size={16} />
          Adicionar item
        </button>
      </div>

      <div className="space-y-2">
        {rows.map((row) => {
          const options = row.type === "PRODUCT" ? products : services;
          return (
            <div key={row.id} className="grid gap-2 sm:grid-cols-[160px_1fr_80px_38px]">
              <select
                name="itemType"
                value={row.type}
                onChange={(event) =>
                  handleRowChange(row.id, {
                    type: event.target.value as "PRODUCT" | "SERVICE",
                    itemId: "",
                  })
                }
                className="h-11 rounded-lg px-3"
              >
                <option value="PRODUCT">Produto</option>
                <option value="SERVICE">Serviço</option>
              </select>

              <select
                name="itemId"
                value={row.itemId}
                onChange={(event) => handleRowChange(row.id, { itemId: event.target.value })}
                className="h-11 rounded-lg px-3"
              >
                <option value="">
                  {row.type === "PRODUCT" ? "Selecione produto" : "Selecione serviço"}
                </option>
                {options.map((option) => {
                  const value = row.type === "PRODUCT" ? brl((option as Product).sellPrice) : brl((option as Service).price);
                  return (
                    <option key={option.id} value={option.id}>
                      {option.name} · {value}
                    </option>
                  );
                })}
              </select>

              <input
                name="itemQuantity"
                type="number"
                min={1}
                value={row.quantity}
                onChange={(event) =>
                  handleRowChange(row.id, {
                    quantity: Math.max(1, Number(event.target.value) || 1),
                  })
                }
                className="h-11 rounded-lg px-3"
                aria-label="Quantidade"
              />

              <button
                type="button"
                onClick={() => handleRemoveRow(row.id)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                aria-label="Remover item"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
