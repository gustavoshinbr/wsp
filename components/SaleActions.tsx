"use client";

import { Pencil, ShieldAlert, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { ActionModal } from "@/components/ActionModal";
import { Button } from "@/components/Button";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";

type SaleActionProps = {
  sale: {
    id: string;
    clientId: string | null;
    motorcycleId: string | null;
    mechanicId: string | null;
    paymentMethod: string | null;
    paymentStatus: string;
    dueDate: string | null;
    lockedByFiscal: boolean;
    items: Array<{
      id: string;
      description: string;
      quantity: number;
      unitPrice: number;
      catalogItem: boolean;
    }>;
  };
  clients: Array<{ id: string; name: string }>;
  motorcycles: Array<{ id: string; plate: string; clientId: string; clientName: string }>;
  mechanics: Array<{ id: string; name: string }>;
  canManage: boolean;
};

const paymentMethods = ["Pix", "Dinheiro", "Cartão de crédito", "Cartão de débito", "A prazo"];

export function SaleActions({ sale, clients, motorcycles, mechanics, canManage }: SaleActionProps) {
  const [editing, setEditing] = useState(false);
  const close = useCallback(() => setEditing(false), []);

  if (!canManage) return null;

  if (sale.lockedByFiscal) {
    return (
      <span className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-bold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        <ShieldAlert size={15} />
        Documento fiscal vinculado
      </span>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" onClick={() => setEditing(true)} className="h-10 min-h-10 px-3">
          <Pencil size={16} />
          Editar
        </Button>
        <form action={`/api/vendas/${sale.id}`} method="post">
          <input type="hidden" name="_method" value="delete" />
          <ConfirmSubmitButton
            message="Excluir esta venda? O estoque dos produtos será devolvido e a operação de origem será reaberta."
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-bold text-red-600 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
          >
            <Trash2 size={16} />
            Excluir
          </ConfirmSubmitButton>
        </form>
      </div>

      <ActionModal
        open={editing}
        onClose={close}
        title="Editar venda"
        description="O total e o estoque serão recalculados no servidor."
        maxWidth="max-w-2xl"
      >
        <form
          action={`/api/vendas/${sale.id}`}
          method="post"
          data-reset-on-success="true"
          onSubmit={(event) => event.currentTarget.addEventListener("wsp:success", close, { once: true })}
          className="mt-5 space-y-4"
        >
          <input type="hidden" name="_method" value="update" />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm font-semibold">
              <span>Cliente</span>
              <select name="clientId" defaultValue={sale.clientId || ""} className="h-11 rounded-lg px-3">
                <option value="">Venda avulsa</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </label>
            <label className="block space-y-1.5 text-sm font-semibold">
              <span>Moto</span>
              <select name="motorcycleId" defaultValue={sale.motorcycleId || ""} className="h-11 rounded-lg px-3">
                <option value="">Sem moto</option>
                {motorcycles.map((motorcycle) => (
                  <option key={motorcycle.id} value={motorcycle.id}>{motorcycle.plate} - {motorcycle.clientName}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5 text-sm font-semibold">
              <span>Mecânico</span>
              <select name="mechanicId" defaultValue={sale.mechanicId || ""} className="h-11 rounded-lg px-3">
                <option value="">Sem mecânico</option>
                {mechanics.map((mechanic) => <option key={mechanic.id} value={mechanic.id}>{mechanic.name}</option>)}
              </select>
            </label>
            <label className="block space-y-1.5 text-sm font-semibold">
              <span>Pagamento</span>
              <select name="paymentMethod" defaultValue={sale.paymentMethod || ""} className="h-11 rounded-lg px-3">
                {!paymentMethods.includes(sale.paymentMethod || "") ? <option value={sale.paymentMethod || ""}>{sale.paymentMethod || "Sem forma"}</option> : null}
                {paymentMethods.map((method) => <option key={method}>{method}</option>)}
              </select>
            </label>
          </div>

          <label className="block space-y-1.5 text-sm font-semibold">
            <span>Vencimento da venda a prazo</span>
            <input name="dueDate" type="date" defaultValue={sale.dueDate || ""} className="h-11 rounded-lg px-3" />
          </label>

          <div className="space-y-2">
            <p className="text-sm font-black">Itens da venda</p>
            {sale.items.map((item) => (
              <div key={item.id} className="grid gap-2 rounded-lg border border-racing-line bg-racing-soft p-3 sm:grid-cols-[1fr_90px_130px]">
                <input type="hidden" name="itemId" value={item.id} />
                <input
                  name="itemDescription"
                  required
                  readOnly={item.catalogItem}
                  defaultValue={item.description}
                  className="h-11 rounded-lg px-3 read-only:cursor-not-allowed read-only:opacity-70"
                  aria-label="Descrição do item"
                />
                <input name="itemQuantity" required type="number" min={1} defaultValue={item.quantity} className="h-11 rounded-lg px-3" aria-label="Quantidade" />
                <input
                  name="itemUnitPrice"
                  required
                  readOnly={item.catalogItem}
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={item.unitPrice}
                  className="h-11 rounded-lg px-3 read-only:cursor-not-allowed read-only:opacity-70"
                  aria-label="Valor unitário"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={close}>Cancelar</Button>
            <Button type="submit">Salvar e recalcular</Button>
          </div>
        </form>
      </ActionModal>
    </>
  );
}
