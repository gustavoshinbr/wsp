"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/Badge";

export function SubscriptionStatusBadge({
  status,
  trialEndsAt,
  subscriptionCurrentPeriodEnd,
  className,
}: {
  status: string;
  trialEndsAt: string;
  subscriptionCurrentPeriodEnd?: string | null;
  className?: string;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const subscriptionActive =
    status === "ACTIVE" &&
    Boolean(subscriptionCurrentPeriodEnd) &&
    (now === null || new Date(subscriptionCurrentPeriodEnd!).getTime() > now);
  const trialRemaining = now === null ? null : Math.max(0, new Date(trialEndsAt).getTime() - now);
  const trialActive = trialRemaining === null || trialRemaining > 0;
  const trialDays = Math.floor((trialRemaining || 0) / 86_400_000);
  const trialHours = Math.floor(((trialRemaining || 0) % 86_400_000) / 3_600_000);

  let message = "Assinatura necessária.";
  let mobileMessage = "Assinatura inativa";
  let tone: "green" | "amber" | "red" = "red";
  if (subscriptionActive) {
    message = `Assinatura ativa até ${new Date(subscriptionCurrentPeriodEnd!).toLocaleDateString("pt-BR")}.`;
    mobileMessage = "Assinatura ativa";
    tone = "green";
  } else if (trialActive) {
    message = trialRemaining === null
      ? "Teste grátis em andamento."
      : `Teste grátis: ${trialDays}d ${trialHours}h restantes.`;
    mobileMessage = "Período de teste";
    tone = "amber";
  } else if (status === "OVERDUE") {
    message = "Pagamento em atraso.";
  } else if (status === "CANCELED") {
    message = "Assinatura cancelada.";
  }

  return (
    <Badge tone={tone} className={className}>
      <ShieldCheck size={14} className="mr-1" />
      <span className="sm:hidden">{mobileMessage}</span>
      <span className="hidden sm:inline">{message}</span>
    </Badge>
  );
}
