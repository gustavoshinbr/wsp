"use client";

import * as React from "react";
import { Pencil, X } from "lucide-react";
import { ActionModal } from "@/components/ActionModal";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { MotorcycleDialog } from "@/components/MotorcycleDialog";

type EditableClient = {
  id: string;
  name: string;
  phone: string;
  document: string | null;
  email: string | null;
  address: string | null;
};

export function ClientActions({ client, canDelete }: { client: EditableClient; canDelete: boolean }) {
  const [editing, setEditing] = React.useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <MotorcycleDialog clients={[{ id: client.id, name: client.name }]} clientId={client.id} compact />
        <button
          type="button"
          title="Editar cliente"
          aria-label={`Editar ${client.name}`}
          onClick={() => setEditing(true)}
          className="grid h-10 w-10 place-items-center rounded-lg border border-racing-line bg-racing-panel text-racing-muted hover:bg-racing-soft hover:text-racing-red"
        >
          <Pencil size={17} />
        </button>
        {canDelete ? (
          <form action={`/api/clientes/${client.id}`} method="post">
            <input type="hidden" name="_method" value="delete" />
            <ConfirmSubmitButton
              message={`Excluir o cliente "${client.name}"?`}
              title="Excluir cliente"
              aria-label={`Excluir ${client.name}`}
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
        title="Editar cliente"
        description="Atualize os dados de contato e faturamento."
        maxWidth="max-w-lg"
      >
            <form
              action={`/api/clientes/${client.id}`}
              method="post"
              data-reset-on-success="true"
              onSubmit={(event) => event.currentTarget.addEventListener("wsp:success", () => setEditing(false), { once: true })}
              className="mt-5 space-y-3"
            >
              <input type="hidden" name="_method" value="update" />
              <label className="block space-y-1.5 text-sm font-semibold">
                <span>Nome</span>
                <input name="name" required defaultValue={client.name} className="h-11 rounded-lg px-3" />
              </label>
              <label className="block space-y-1.5 text-sm font-semibold">
                <span>Telefone</span>
                <input name="phone" required defaultValue={client.phone} className="h-11 rounded-lg px-3" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5 text-sm font-semibold">
                  <span>CPF/CNPJ</span>
                  <input name="document" inputMode="numeric" defaultValue={client.document || ""} className="h-11 rounded-lg px-3" />
                </label>
                <label className="block space-y-1.5 text-sm font-semibold">
                  <span>E-mail</span>
                  <input name="email" type="email" defaultValue={client.email || ""} className="h-11 rounded-lg px-3" />
                </label>
              </div>
              <label className="block space-y-1.5 text-sm font-semibold">
                <span>Endereço</span>
                <input name="address" defaultValue={client.address || ""} className="h-11 rounded-lg px-3" />
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
                  Salvar alterações
                </button>
              </div>
            </form>
      </ActionModal>
    </>
  );
}
