export function appointmentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    SCHEDULED: "PENDENTE",
    FINISHED: "FINALIZADO",
    CANCELLED: "CANCELADO",
  };

  return labels[status] || status;
}
