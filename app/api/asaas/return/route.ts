import { addDays } from "date-fns";
import { NextResponse } from "next/server";
import { getAsaasSubscription, getFirstSubscriptionPayment, isPaidAsaasPaymentStatus } from "@/lib/asaas";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";

function redirectTo(path: string, req: Request) {
  return NextResponse.redirect(new URL(path, req.url), { status: 303 });
}

export async function GET(req: Request) {
  try {
    const user = await requireApiUser({ allowExpiredSubscription: true });
    const subscriptionId = user.workspace.asaasSubscriptionId;

    if (!subscriptionId) return redirectTo("/assinatura", req);

    const [subscription, payment] = await Promise.all([
      getAsaasSubscription(subscriptionId).catch(() => null),
      getFirstSubscriptionPayment(subscriptionId).catch(() => null),
    ]);
    const isPaid = isPaidAsaasPaymentStatus(payment?.status);

    const workspace = await prisma.workspace.update({
      where: { id: user.workspaceId },
      data: {
        ...(isPaid ? { subscriptionStatus: "ACTIVE" as const } : {}),
        paymentStatus: payment?.status || subscription?.status || user.workspace.paymentStatus,
        ...(subscription?.nextDueDate
          ? { subscriptionCurrentPeriodEnd: addDays(new Date(subscription.nextDueDate), 30) }
          : {}),
      },
    });

    setSessionCookie({
      userId: user.id,
      workspaceId: workspace.id,
      email: user.email,
      remember: true,
      subscriptionStatus: workspace.subscriptionStatus,
      trialEndsAt: workspace.trialEndsAt,
    });

    if (workspace.subscriptionStatus === "ACTIVE") return redirectTo("/dashboard", req);
    return redirectTo("/assinatura?error=Pagamento ainda nao confirmado. Aguarde alguns segundos.", req);
  } catch {
    return redirectTo("/login", req);
  }
}
