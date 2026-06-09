import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CreditCard } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/Card";
import { SubscriptionStatusRedirect } from "@/components/SubscriptionStatusRedirect";
import { getCurrentSubscriptionPayment, paymentUrlWithAutoRedirect } from "@/lib/asaas";
import { requirePageUser } from "@/lib/auth";
import { brl } from "@/lib/currency";
import { isSubscriptionActive } from "@/lib/subscription";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ subscription?: string; paymentLink?: string }>;
}) {
  const query = await searchParams;
  const user = await requirePageUser({ allowExpiredSubscription: true });
  if (isSubscriptionActive(user.workspace)) redirect("/dashboard");

  const existingSubscriptionId =
    user.workspace.subscriptionStatus !== "CANCELED" ? user.workspace.asaasSubscriptionId : null;
  const existingPayment =
    !query.paymentLink && existingSubscriptionId
      ? await getCurrentSubscriptionPayment(existingSubscriptionId).catch(() => null)
      : null;
  const paymentLink = query.paymentLink || paymentUrlWithAutoRedirect(existingPayment?.invoiceUrl || null);

  return (
    <AppShell allowExpiredSubscription>
      <SubscriptionStatusRedirect />
      <div className="mx-auto max-w-2xl">
        <Card>
          <span className="grid h-12 w-12 place-items-center rounded-full bg-red-50 text-racing-red dark:bg-red-500/10">
            <CreditCard size={22} />
          </span>
          <h1 className="mt-5 text-3xl font-black">Checkout Asaas</h1>
          <p className="mt-3 text-racing-muted">
            Assinatura recorrente WSP Racing Pro no valor de {brl(Number(process.env.ASAAS_PLAN_VALUE || 50))}/mês.
          </p>
          {existingSubscriptionId ? (
            <p className="mt-4 rounded-lg bg-racing-soft p-3 text-sm font-semibold text-racing-muted">
              Já existe uma cobrança gerada para esta assinatura. Use o mesmo pagamento para continuar.
            </p>
          ) : null}
          {paymentLink ? (
            <Link
              href={paymentLink}
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-racing-red px-4 py-2 text-sm font-bold text-white"
            >
              Abrir pagamento
              <ArrowRight size={17} />
            </Link>
          ) : (
            <form action="/api/asaas/create-subscription" method="post" data-native-submit="true" className="mt-6">
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-racing-red px-4 py-2 text-sm font-bold text-white">
                {existingSubscriptionId ? "Abrir pagamento existente" : "Gerar link de pagamento"}
                <ArrowRight size={17} />
              </button>
            </form>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
