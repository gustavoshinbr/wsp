import { CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { getFirstSubscriptionPayment } from "@/lib/asaas";
import { requirePageUser } from "@/lib/auth";
import { brl } from "@/lib/currency";
import { isSubscriptionActive, subscriptionMessage } from "@/lib/subscription";

const benefits = [
  "Clientes ilimitados",
  "Produtos e estoque com fotos",
  "Orcamentos",
  "Agendamentos",
  "Relatorios",
  "Modo claro/escuro",
  "Suporte para celular e PC",
];

export default async function SubscriptionPage({ searchParams }: { searchParams: { error?: string } }) {
  const user = await requirePageUser({ allowExpiredSubscription: true });
  const value = Number(process.env.ASAAS_PLAN_VALUE || 50);
  if (isSubscriptionActive(user.workspace)) redirect("/dashboard");

  const existingSubscriptionId =
    user.workspace.subscriptionStatus !== "CANCELED" ? user.workspace.asaasSubscriptionId : null;
  const existingPayment = existingSubscriptionId
    ? await getFirstSubscriptionPayment(existingSubscriptionId).catch(() => null)
    : null;
  const existingPaymentLink = existingPayment?.invoiceUrl || null;

  return (
    <AppShell allowExpiredSubscription>
      <div className="mx-auto max-w-4xl">
        {searchParams.error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {searchParams.error}
          </div>
        ) : null}

        <Card className="overflow-hidden p-0">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.85fr]">
            <div className="p-6 lg:p-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-sm font-black text-racing-red dark:bg-red-500/10">
                <ShieldCheck size={16} />
                {subscriptionMessage(user.workspace)}
              </span>
              <h1 className="mt-5 text-3xl font-black sm:text-4xl">WSP Racing Pro</h1>
              <p className="mt-3 text-racing-muted">
                {existingSubscriptionId
                  ? "Ja existe um pagamento gerado para esta assinatura. Use o mesmo link para concluir, sem criar outra cobranca."
                  : "Ative a assinatura para continuar usando todos os modulos depois do periodo de teste."}
              </p>
              <div className="mt-6 flex items-end gap-2">
                <strong className="text-5xl font-black">{brl(value)}</strong>
                <span className="pb-2 text-racing-muted">/mes</span>
              </div>
              {existingPaymentLink ? (
                <Link
                  href={existingPaymentLink}
                  className="mt-8 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-racing-red px-4 py-2 text-sm font-bold text-white hover:bg-red-700 sm:w-auto"
                >
                  <CreditCard size={18} />
                  Abrir pagamento pendente
                </Link>
              ) : (
                <form action="/api/asaas/create-subscription" method="post" className="mt-8">
                  <Button type="submit" className="w-full sm:w-auto">
                    <CreditCard size={18} />
                    {existingSubscriptionId ? "Abrir pagamento pendente" : "Ativar assinatura"}
                  </Button>
                </form>
              )}
            </div>

            <div className="border-t border-racing-line bg-racing-soft p-6 lg:border-l lg:border-t-0 lg:p-8">
              <h2 className="text-lg font-black">Beneficios incluidos</h2>
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
