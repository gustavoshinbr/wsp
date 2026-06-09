"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type TimelineProps = {
  status: string;
  trialStartAt: string;
  trialEndsAt: string;
  subscriptionActivatedAt?: string | null;
  subscriptionCurrentPeriodEnd?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function countdown(target?: string | null, now?: number | null) {
  if (!target) return "-";
  if (now === null || now === undefined) return "Atualizando...";
  const remaining = Math.max(0, new Date(target).getTime() - now);
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);
  return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

export function SubscriptionTimeline(props: TimelineProps) {
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null);
  const subscriptionActive =
    props.status === "ACTIVE" &&
    Boolean(props.subscriptionCurrentPeriodEnd) &&
    (now === null || new Date(props.subscriptionCurrentPeriodEnd!).getTime() > now);
  const hasSubscription =
    Boolean(props.subscriptionActivatedAt) &&
    Boolean(props.subscriptionCurrentPeriodEnd);
  const trialActive = now === null || new Date(props.trialEndsAt).getTime() > now;
  const target = subscriptionActive ? props.subscriptionCurrentPeriodEnd : props.trialEndsAt;

  const signature = useMemo(
    () => [
      props.status,
      props.trialStartAt,
      props.trialEndsAt,
      props.subscriptionActivatedAt || "",
      props.subscriptionCurrentPeriodEnd || "",
    ].join("|"),
    [props],
  );

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function refreshStatus() {
      const response = await fetch("/api/auth/me", { cache: "no-store" }).catch(() => null);
      if (!response?.ok) return;
      const data = await response.json();
      const workspace = data?.workspace;
      const currentSignature = [
        workspace?.subscriptionStatus || "",
        workspace?.trialStartAt || "",
        workspace?.trialEndsAt || "",
        workspace?.subscriptionActivatedAt || "",
        workspace?.subscriptionCurrentPeriodEnd || "",
      ].join("|");
      if (!cancelled && currentSignature !== signature) router.refresh();
    }
    const timer = window.setInterval(refreshStatus, 5_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [router, signature]);

  const items = hasSubscription
    ? [
        ["Assinatura iniciada", formatDate(props.subscriptionActivatedAt)],
        [subscriptionActive ? "Próximo vencimento" : "Assinatura venceu", formatDate(props.subscriptionCurrentPeriodEnd)],
        [
          subscriptionActive ? "Tempo até o vencimento" : "Status do período",
          subscriptionActive ? countdown(target, now) : "Vencido",
        ],
      ]
    : [
        ["Teste iniciado", formatDate(props.trialStartAt)],
        ["Teste termina", formatDate(props.trialEndsAt)],
        [trialActive ? "Tempo restante" : "Teste finalizado", trialActive ? countdown(target, now) : "0d 00h 00m 00s"],
      ];

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-racing-line bg-racing-soft p-4">
          <p className="text-xs font-black uppercase text-racing-muted">{label}</p>
          <p className="mt-2 text-lg font-black">{value}</p>
        </div>
      ))}
    </div>
  );
}
