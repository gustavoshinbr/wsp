"use client";

import * as React from "react";
import { Pencil, X } from "lucide-react";

type EditableClient = {
  id: string;
  name: string;
  phone: string;
  address: string | null;
};

export function ClientActions({ client }: { client: EditableClient }) {
  const [editing, setEditing] = React.useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          title="Editar cliente"
          aria-label={`Editar ${client.name}`}
          onClick={() => setEditing(true)}
          className="grid h-10 w-10 place-items-center rounded-lg border border-racing-line bg-racing-panel text-racing-muted hover:bg-racing-soft hover:text-racing-red"
        >
          <Pencil size={17} />
        </button>
        <form action={`/api/clientes/${client.id}`} method="post">
          <input type="hidden" name="_method" value="delete" />
          <button
            type="submit"
            title="Excluir cliente"
            aria-label={`Excluir ${client.name}`}
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
                <h2 className="text-xl font-black">Editar cliente</h2>
                <p className="text-sm text-racing-muted">Atualize nome, telefone e endereço.</p>
              </div>
              <button
                type="button"
                aria-label="Fechar edição"
                onClick={() => setEditing(false)}
                className="grid h-10 w-10 place-items-center rounded-lg border border-racing-line text-racing-muted"
              >
                <X size={18} />
              </button>
            </div>

            <form action={`/api/clientes/${client.id}`} method="post" className="mt-5 space-y-3">
              <input type="hidden" name="_method" value="update" />
              <label className="block space-y-1.5 text-sm font-semibold">
                <span>Nome</span>
                <input name="name" required defaultValue={client.name} className="h-11 rounded-lg px-3" />
              </label>
              <label className="block space-y-1.5 text-sm font-semibold">
                <span>Telefone</span>
                <input name="phone" required defaultValue={client.phone} className="h-11 rounded-lg px-3" />
              </label>
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
          </div>
        </div>
      ) : null}
    </>
  );
}
