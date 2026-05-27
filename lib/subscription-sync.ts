import { addDays } from "date-fns";
import { getAsaasSubscription, getFirstSubscriptionPayment, isPaidAsaasPaymentStatus, type AsaasPayment } from "@/lib/asaas";
import { prisma } from "@/lib/prisma";

function paidAtFromPayment(payment?: AsaasPayment | null) {
  const date = payment?.clientPaymentDate || payment?.paymentDate || payment?.dueDate;
  return date ? new Date(date) : new Date();
}

function periodEndFromAsaas(input: {
  nextDueDate?: string | null;
  payment?: AsaasPayment | null;
}) {
  if (input.nextDueDate) return new Date(input.nextDueDate);

  const paidAt = input.payment?.clientPaymentDate || input.payment?.paymentDate || input.payment?.dueDate;
  return paidAt ? addDays(new Date(paidAt), 30) : undefined;
}

export async function syncWorkspaceSubscription(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace?.asaasSubscriptionId) return workspace;

  const [subscription, payment] = await Promise.all([
    getAsaasSubscription(workspace.asaasSubscriptionId).catch(() => null),
    getFirstSubscriptionPayment(workspace.asaasSubscriptionId).catch(() => null),
  ]);

  const isPaid = isPaidAsaasPaymentStatus(payment?.status);
  const subscriptionStatus = String(subscription?.status || "").toUpperCase();
  const paymentStatus = String(payment?.status || "").toUpperCase();
  const periodEnd = isPaid
    ? periodEndFromAsaas({ nextDueDate: subscription?.nextDueDate, payment })
    : undefined;

  const nextStatus =
    isPaid
      ? "ACTIVE"
      : paymentStatus === "OVERDUE"
        ? "OVERDUE"
        : subscriptionStatus === "DELETED" || subscriptionStatus === "CANCELED"
          ? "CANCELED"
          : workspace.subscriptionStatus;

  return prisma.workspace.update({
    where: { id: workspace.id },
    data: {
      subscriptionStatus: nextStatus,
      paymentStatus: payment?.status || subscription?.status || workspace.paymentStatus,
      ...(periodEnd ? { subscriptionCurrentPeriodEnd: periodEnd } : {}),
      ...(isPaid && !workspace.subscriptionActivatedAt ? { subscriptionActivatedAt: paidAtFromPayment(payment) } : {}),
      lastPaymentEvent: isPaid ? "SYNC_PAYMENT_PAID" : "SYNC_SUBSCRIPTION_STATUS",
    },
  });
}
