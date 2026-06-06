"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";

const DEFAULTS = {
  defaultCfop: "5102",
  defaultCsosn: "102",
  defaultUnit: "UN",
  defaultPisCst: "49",
  defaultCofinsCst: "49",
  defaultOrigin: "0",
} as const;

export function FiscalDefaultsButton({ formId }: { formId: string }) {
  const [updating, setUpdating] = useState(false);

  function applyDefaults() {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;

    Object.entries(DEFAULTS).forEach(([name, value]) => {
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLInputElement) {
        field.value = value;
        field.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    const ncm = form.elements.namedItem("defaultNcm");
    if (ncm instanceof HTMLInputElement && !/^\d{8}$/.test(ncm.value.replace(/\D/g, ""))) {
      ncm.value = "";
    }

    if (!form.reportValidity()) return;
    setUpdating(true);
    form.requestSubmit();
  }

  return (
    <button
      type="button"
      onClick={applyDefaults}
      disabled={updating}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-racing-line bg-racing-panel px-4 py-2 text-sm font-black hover:bg-racing-soft"
    >
      <RefreshCw size={17} className={updating ? "animate-spin" : undefined} />
      {updating ? "Atualizando..." : "Atualizar padrões automáticos"}
    </button>
  );
}
