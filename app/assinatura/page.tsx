import { CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { requirePageUser } from "@/lib/auth";
import { brl } from "@/lib/currency";
import { subscriptionMessage } from "@/lib/subscription";

const benefits = [
  "Clientes ilimitados",
  "Produtos e estoque com fotos",
  "Orçamentos",
  "Agendamentos",
  "Relatórios",
  "Modo claro/escuro",
  "Suporte para celular e PC",
];

export default async function SubscriptionPage({ searchParams }: { searchParams: { error?: string } }) {
  const user = await requirePageUser({ allowExpiredSubscription: true });
  const value = Number(process.env.ASAAS_PLAN_VALUE || 50);

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
                Seu teste grátis acabou ou está perto de acabar. Ative a assinatura para continuar usando todos os módulos.
              </p>
              <div className="mt-6 flex items-end gap-2">
                <strong className="text-5xl font-black">{brl(value)}</strong>
                <span className="pb-2 text-racing-muted">/mês</span>
              </div>
              <form action="/api/asaas/create-subscription" method="post" className="mt-8">
                <Button type="submit" className="w-full sm:w-auto">
                  <CreditCard size={18} />
                  Ativar assinatura
                </Button>
              </form>
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
