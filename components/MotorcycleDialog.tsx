"use client";

import { Bike, Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { ActionModal } from "@/components/ActionModal";
import { Button } from "@/components/Button";

type ClientOption = {
  id: string;
  name: string;
};

export function MotorcycleDialog({
  clients,
  clientId,
  compact = false,
}: {
  clients: ClientOption[];
  clientId?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className={compact ? "h-10 min-h-10 px-3" : ""}>
        <Bike size={17} />
        <span>{compact ? "Moto" : "Adicionar moto"}</span>
        {!compact ? <Plus size={14} /> : null}
      </Button>

      <ActionModal
        open={open}
        onClose={close}
        title="Adicionar moto"
        description="Vincule uma nova moto a um cliente já cadastrado."
      >
        <form
          action="/api/motos"
          method="post"
          data-reset-on-success="true"
          onSubmit={(event) => {
            event.currentTarget.addEventListener("wsp:success", close, { once: true });
          }}
          className="mt-5 space-y-3"
        >
          <label className="block space-y-1.5 text-sm font-semibold">
            <span>Cliente</span>
            <select name="clientId" required defaultValue={clientId || ""} className="h-11 rounded-lg px-3">
              <option value="">Selecione o cliente</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm font-semibold">
              <span>Placa</span>
              <input name="plate" required autoCapitalize="characters" className="h-11 rounded-lg px-3 uppercase" placeholder="ABC1D23" />
            </label>
            <label className="block space-y-1.5 text-sm font-semibold">
              <span>Modelo</span>
              <input name="model" className="h-11 rounded-lg px-3" placeholder="CG 160" />
            </label>
            <label className="block space-y-1.5 text-sm font-semibold">
              <span>Marca</span>
              <input name="brand" className="h-11 rounded-lg px-3" placeholder="Honda" />
            </label>
            <label className="block space-y-1.5 text-sm font-semibold">
              <span>Ano</span>
              <input name="year" inputMode="numeric" className="h-11 rounded-lg px-3" placeholder="2024" />
            </label>
          </div>
          <label className="block space-y-1.5 text-sm font-semibold">
            <span>Cor</span>
            <input name="color" className="h-11 rounded-lg px-3" placeholder="Cor da moto" />
          </label>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={close}>Cancelar</Button>
            <Button type="submit">
              <Plus size={17} />
              Adicionar moto
            </Button>
          </div>
        </form>
      </ActionModal>
    </>
  );
}
