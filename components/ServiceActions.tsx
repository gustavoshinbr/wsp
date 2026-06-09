"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { ActionModal } from "@/components/ActionModal";
import { Button } from "@/components/Button";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";

type EditableService = {
  id: string;
  name: string;
  price: number;
  description: string | null;
};

export function ServiceActions({ service, canDelete }: { service: EditableService; canDelete: boolean }) {
  const [editing, setEditing] = useState(false);
  const close = useCallback(() => setEditing(false), []);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Editar serviço"
          aria-label={`Editar ${service.name}`}
          className="grid h-10 w-10 place-items-center rounded-lg border border-racing-line bg-racing-panel text-racing-muted hover:bg-racing-soft hover:text-racing-red"
        >
          <Pencil size={17} />
        </button>
        {canDelete ? (
          <form action={`/api/servicos/${service.id}`} method="post">
            <input type="hidden" name="_method" value="delete" />
            <ConfirmSubmitButton
              message={`Excluir o serviço "${service.name}"? O histórico continuará com a descrição original.`}
              title="Excluir serviço"
              aria-label={`Excluir ${service.name}`}
              className="grid h-10 w-10 place-items-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
            >
              <Trash2 size={17} />
            </ConfirmSubmitButton>
          </form>
        ) : null}
      </div>

      <ActionModal
        open={editing}
        onClose={close}
        title="Editar serviço"
        description="Atualize o nome, valor e descrição usados nos próximos lançamentos."
      >
        <form
          action={`/api/servicos/${service.id}`}
          method="post"
          data-reset-on-success="true"
          onSubmit={(event) => event.currentTarget.addEventListener("wsp:success", close, { once: true })}
          className="mt-5 space-y-3"
        >
          <input type="hidden" name="_method" value="update" />
          <label className="block space-y-1.5 text-sm font-semibold">
            <span>Serviço</span>
            <input name="name" required defaultValue={service.name} className="h-11 rounded-lg px-3" />
          </label>
          <label className="block space-y-1.5 text-sm font-semibold">
            <span>Valor</span>
            <input name="price" required type="number" min="0" step="0.01" defaultValue={service.price} className="h-11 rounded-lg px-3" />
          </label>
          <label className="block space-y-1.5 text-sm font-semibold">
            <span>Descrição</span>
            <textarea name="description" rows={4} defaultValue={service.description || ""} className="rounded-lg px-3 py-2" />
          </label>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={close}>Cancelar</Button>
            <Button type="submit">Salvar alterações</Button>
          </div>
        </form>
      </ActionModal>
    </>
  );
}
