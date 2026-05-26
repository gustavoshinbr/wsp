"use client";

import { Plus, Wrench } from "lucide-react";
import { useState } from "react";

export function LaborRows() {
  const [rows, setRows] = useState([0]);

  return (
    <div className="rounded-lg border border-racing-line bg-racing-soft p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-black">
          <Wrench size={16} className="text-racing-red" />
          Mão de obra
        </p>
        <button
          type="button"
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-racing-red px-3 text-xs font-black text-white"
          onClick={() => setRows((current) => [...current, Date.now()])}
        >
          <Plus size={14} />
          Adicionar mão de obra
        </button>
      </div>
      <div className="mt-3 space-y-2">
        {rows.map((row, index) => (
          <div key={row} className="grid grid-cols-[1fr_120px] gap-2">
            <input name="laborDescription" className="h-11 rounded-lg px-3" placeholder={index === 0 ? "Ex: desmontagem do motor" : "Descrição"} />
            <input name="laborValue" type="number" step="0.01" min="0" className="h-11 rounded-lg px-3" placeholder="Valor" />
          </div>
        ))}
      </div>
    </div>
  );
}
