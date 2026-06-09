import { CalendarDays, CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { SubscriptionTimeline } from "@/components/SubscriptionTimeline";
import { getCurrentSubscriptionPayment, paymentUrlWithAutoRedirect } from "@/lib/asaas";
import { requirePageUser } from "@/lib/auth";
import { brl } from "@/lib/currency";
import { isSubscriptionActive, subscriptionMessage } from "@/lib/subscription";

const benefits = [
  "Clientes ilimitados",
  "Produtos e estoque com fotos",
  "Orçamentos",
  "Agendamentos",
  "Relatórios",
  "Modo claro/escuro",
  "Suporte para celular e PC",
];

function paymentStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    ACTIVE: "Ativa",
    AWAITING_PAYMENT: "Aguardando pagamento",
    CONFIRMED: "Confirmado",
    OVERDUE: "Em atraso",
    PENDING: "Pendente",
    RECEIVED: "Recebido",
    RECEIVED_IN_CASH: "Recebido em dinheiro",
  };

  return labels[String(status || "").toUpperCase()] || status || "-";
}

export default async function SubscriptionPage({ searchParams }: { searchParams: Promise<{ error?: string; synced?: string }> }) {
  const query = await searchParams;
  const user = await requirePageUser({ allowExpiredSubscription: true });
  if (user.role === "STAFF") redirect("/dashboard");
  const value = Number(process.env.ASAAS_PLAN_VALUE || 50);
  const workspace = user.workspace;
  const active = isSubscriptionActive(workspace);

  const existingSubscriptionId =
    workspace.subscriptionStatus !== "CANCELED" ? workspace.asaasSubscriptionId : null;
  const existingPayment = existingSubscriptionId && !active
    ? await getCurrentSubscriptionPayment(existingSubscriptionId).catch(() => null)
    : null;
  const existingPaymentLink = paymentUrlWithAutoRedirect(existingPayment?.invoiceUrl || null);

  return (
    <AppShell allowExpiredSubscription>
      <div className="mx-auto max-w-4xl">
        {query.error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {query.error}
          </div>
        ) : null}
        {query.synced ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            Status da assinatura atualizado.
          </div>
        ) : null}

        <Card className="overflow-hidden p-0">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.85fr]">
            <div className="p-6 lg:p-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-sm font-black text-racing-red dark:bg-red-500/10">
                <ShieldCheck size={16} />
                {subscriptionMessage(workspace)}
              </span>
              <h1 className="mt-5 text-3xl font-black sm:text-4xl">Gerenciar assinatura</h1>
              <p className="mt-3 text-racing-muted">
                {active
                  ? "Sua assinatura está ativa. Acompanhe abaixo a data de ativação e o vencimento do período atual."
                  : existingSubscriptionId
                  ? "Já existe um pagamento gerado para esta assinatura. Use o mesmo link para concluir, sem criar outra cobrança."
                  : "Ative a assinatura para continuar usando todos os módulos depois do período de teste."}
              </p>

              <SubscriptionTimeline
                status={workspace.subscriptionStatus}
                trialStartAt={workspace.trialStartAt.toISOString()}
                trialEndsAt={workspace.trialEndsAt.toISOString()}
                subscriptionActivatedAt={workspace.subscriptionActivatedAt?.toISOString()}
                subscriptionCurrentPeriodEnd={workspace.subscriptionCurrentPeriodEnd?.toISOString()}
              />

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="flex items-end gap-2">
                  <strong className="text-4xl font-black">{brl(value)}</strong>
                  <span className="pb-2 text-racing-muted">/mês</span>
                </div>
                {workspace.paymentStatus ? (
                  <span className="inline-flex items-center gap-2 rounded-lg border border-racing-line px-3 py-2 text-xs font-bold text-racing-muted">
                    <CalendarDays size={15} />
                    Pagamento: {paymentStatusLabel(workspace.paymentStatus)}
                  </span>
                ) : null}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {active ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-racing-red px-4 py-2 text-sm font-bold text-white hover:bg-red-700 sm:w-auto"
                  >
                    Voltar ao Início
                  </Link>
                ) : existingPaymentLink ? (
                  <Link
                    href={existingPaymentLink}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-racing-red px-4 py-2 text-sm font-bold text-white hover:bg-red-700 sm:w-auto"
                  >
                    <CreditCard size={18} />
                    Abrir pagamento pendente
                  </Link>
                ) : (
                  <form action="/api/asaas/create-subscription" method="post" data-native-submit="true">
                    <Button type="submit" className="w-full sm:w-auto">
                      <CreditCard size={18} />
                      {existingSubscriptionId ? "Abrir pagamento pendente" : "Ativar assinatura"}
                    </Button>
                  </form>
                )}
              </div>
            </div>

            <div className="border-t border-racing-line bg-racing-soft p-6 lg:border-l lg:border-t-0 lg:p-8">
              <h2 className="text-lg font-black">Benefícios incluídos</h2>
              <ul className="mt-5 space-y-3">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3 text-sm font-semibold">
                    <CheckCircle2 size={18} className="text-emerald-500" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
