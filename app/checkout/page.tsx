import Link from "next/link";
import { ArrowRight, CreditCard } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/Card";
import { brl } from "@/lib/currency";

export default function CheckoutPage({ searchParams }: { searchParams: { subscription?: string; paymentLink?: string } }) {
  return (
    <AppShell allowExpiredSubscription>
      <div className="mx-auto max-w-2xl">
        <Card>
          <span className="grid h-12 w-12 place-items-center rounded-full bg-red-50 text-racing-red dark:bg-red-500/10">
            <CreditCard size={22} />
          </span>
          <h1 className="mt-5 text-3xl font-black">Checkout Asaas</h1>
          <p className="mt-3 text-racing-muted">
            Assinatura recorrente WSP Racing Pro no valor de {brl(Number(process.env.ASAAS_PLAN_VALUE || 50))}/mês.
          </p>
          {searchParams.subscription ? (
            <p className="mt-4 rounded-lg bg-racing-soft p-3 text-sm font-semibold text-racing-muted">
              Assinatura criada: {searchParams.subscription}. O webhook do Asaas ativará o acesso quando o pagamento for confirmado.
            </p>
          ) : null}
          {searchParams.paymentLink ? (
            <Link
              href={searchParams.paymentLink}
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-racing-red px-4 py-2 text-sm font-bold text-white"
            >
              Abrir pagamento
              <ArrowRight size={17} />
            </Link>
          ) : (
            <form action="/api/asaas/create-subscription" method="post" className="mt-6">
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-racing-red px-4 py-2 text-sm font-bold text-white">
                Gerar link de pagamento
                <ArrowRight size={17} />
              </button>
            </form>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
