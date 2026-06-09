"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { ActionModal } from "@/components/ActionModal";
import { Button } from "@/components/Button";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";

type AppointmentActionsProps = {
  appointment: {
    id: string;
    clientId: string;
    motorcycleId: string | null;
    mechanicId: string | null;
    date: string;
    notes: string | null;
    status: "SCHEDULED" | "FINISHED" | "CANCELLED";
  };
  clients: Array<{ id: string; name: string }>;
  motorcycles: Array<{ id: string; plate: string; clientName: string }>;
  mechanics: Array<{ id: string; name: string }>;
  canDelete: boolean;
};

export function AppointmentActions({ appointment, clients, motorcycles, mechanics, canDelete }: AppointmentActionsProps) {
  const [editing, setEditing] = useState(false);
  const close = useCallback(() => setEditing(false), []);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => setEditing(true)} className="h-10 min-h-10 px-3">
          <Pencil size={16} />
          Editar
        </Button>
        {canDelete ? (
          <form action={`/api/agendamentos/${appointment.id}`} method="post">
            <input type="hidden" name="_method" value="delete" />
            <ConfirmSubmitButton
              message={
                appointment.status === "FINISHED"
                  ? "Excluir este agendamento finalizado? A venda gerada será preservada."
                  : "Excluir este agendamento?"
              }
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-bold text-red-600 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
            >
              <Trash2 size={16} />
              Excluir
            </ConfirmSubmitButton>
          </form>
        ) : null}
      </div>

      <ActionModal
        open={editing}
        onClose={close}
        title="Editar agendamento"
        description={appointment.status === "FINISHED" ? "A venda já gerada continuará preservada." : "Atualize os dados do atendimento."}
      >
        <form
          action={`/api/agendamentos/${appointment.id}`}
          method="post"
          data-reset-on-success="true"
          onSubmit={(event) => event.currentTarget.addEventListener("wsp:success", close, { once: true })}
          className="mt-5 space-y-3"
        >
          <input type="hidden" name="_method" value="update" />
          <label className="block space-y-1.5 text-sm font-semibold">
            <span>Cliente</span>
            <select name="clientId" required defaultValue={appointment.clientId} className="h-11 rounded-lg px-3">
              {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm font-semibold">
              <span>Moto</span>
              <select name="motorcycleId" defaultValue={appointment.motorcycleId || ""} className="h-11 rounded-lg px-3">
                <option value="">Sem moto</option>
                {motorcycles.map((motorcycle) => (
                  <option key={motorcycle.id} value={motorcycle.id}>{motorcycle.plate} - {motorcycle.clientName}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5 text-sm font-semibold">
              <span>Mecânico</span>
              <select name="mechanicId" defaultValue={appointment.mechanicId || ""} className="h-11 rounded-lg px-3">
                <option value="">Sem mecânico</option>
                {mechanics.map((mechanic) => <option key={mechanic.id} value={mechanic.id}>{mechanic.name}</option>)}
              </select>
            </label>
          </div>
          <label className="block space-y-1.5 text-sm font-semibold">
            <span>Data e hora</span>
            <input name="date" required type="datetime-local" defaultValue={appointment.date} className="h-11 rounded-lg px-3" />
          </label>
          {appointment.status !== "FINISHED" ? (
            <label className="block space-y-1.5 text-sm font-semibold">
              <span>Status</span>
              <select name="status" defaultValue={appointment.status} className="h-11 rounded-lg px-3">
                <option value="SCHEDULED">Agendado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </label>
          ) : (
            <input type="hidden" name="status" value="FINISHED" />
          )}
          <label className="block space-y-1.5 text-sm font-semibold">
            <span>Observações</span>
            <textarea name="notes" rows={4} defaultValue={appointment.notes || ""} className="rounded-lg px-3 py-2" />
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
