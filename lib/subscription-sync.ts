import { addDays } from "date-fns";
import {
  getAsaasSubscription,
  getPreferredSubscriptionPayment,
  getSubscriptionPayments,
  isPaidAsaasPaymentStatus,
  type AsaasPayment,
  type AsaasSubscription,
} from "@/lib/asaas";
import { prisma } from "@/lib/prisma";

function dateFrom(value?: string | null) {
  return value ? new Date(value) : undefined;
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function isFutureOrToday(date?: Date) {
  return date ? date.getTime() >= startOfToday().getTime() : false;
}

function paymentTime(payment: AsaasPayment) {
  const date = payment.clientPaymentDate || payment.paymentDate || payment.dueDate;
  return date ? new Date(date).getTime() : 0;
}

function latestPaidPayment(payments: AsaasPayment[]) {
  return payments
    .filter((payment) => isPaidAsaasPaymentStatus(payment.status))
    .sort((a, b) => paymentTime(b) - paymentTime(a))[0] || null;
}

function nearestFuturePayment(payments: AsaasPayment[]) {
  return payments
    .filter((payment) => payment.dueDate && isFutureOrToday(new Date(payment.dueDate)))
    .sort((a, b) => paymentTime(a) - paymentTime(b))[0] || null;
}

function paidAtFromPayment(payment?: AsaasPayment | null) {
  const date = payment?.clientPaymentDate || payment?.paymentDate || payment?.dueDate;
  return date ? new Date(date) : new Date();
}

function periodEndFromAsaas(input: {
  subscription?: AsaasSubscription | null;
  payments: AsaasPayment[];
  payment?: AsaasPayment | null;
}) {
  const futurePayment = nearestFuturePayment(input.payments);
  if (futurePayment?.dueDate) return new Date(futurePayment.dueDate);

  if (input.subscription?.nextDueDate) return new Date(input.subscription.nextDueDate);

  const paidAt = input.payment?.clientPaymentDate || input.payment?.paymentDate || input.payment?.dueDate;
  return paidAt ? addDays(new Date(paidAt), 30) : undefined;
}

function activatedAtFromAsaas(input: {
  subscription?: AsaasSubscription | null;
  paidPayment?: AsaasPayment | null;
}) {
  if (input.paidPayment) return paidAtFromPayment(input.paidPayment);
  return dateFrom(input.subscription?.dateCreated);
}

export async function syncWorkspaceSubscription(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace?.asaasSubscriptionId) return workspace;

  const [subscription, payments] = await Promise.all([
    getAsaasSubscription(workspace.asaasSubscriptionId).catch(() => null),
    getSubscriptionPayments(workspace.asaasSubscriptionId).catch(() => []),
  ]);

  const payment = getPreferredSubscriptionPayment(payments);
  const paidPayment = latestPaidPayment(payments);
  const isPaid = Boolean(paidPayment);
  const subscriptionStatus = String(subscription?.status || "").toUpperCase();
  const paymentStatus = String(payment?.status || "").toUpperCase();
  const periodEnd = periodEndFromAsaas({ subscription, payments, payment: paidPayment || payment });
  const isActiveSubscription = subscriptionStatus === "ACTIVE" && isFutureOrToday(periodEnd);
  const isCanceledSubscription = subscriptionStatus === "DELETED" || subscriptionStatus === "CANCELED";
  const activatedAt = activatedAtFromAsaas({ subscription, paidPayment });

  const nextStatus =
    isCanceledSubscription
      ? "CANCELED"
      : isPaid || isActiveSubscription
      ? "ACTIVE"
      : paymentStatus === "OVERDUE"
        ? "OVERDUE"
        : workspace.subscriptionStatus;

  return prisma.workspace.update({
    where: { id: workspace.id },
    data: {
      subscriptionStatus: nextStatus,
      paymentStatus: payment?.status || subscription?.status || workspace.paymentStatus,
      ...(periodEnd ? { subscriptionCurrentPeriodEnd: periodEnd } : {}),
      ...(nextStatus === "ACTIVE" && !workspace.subscriptionActivatedAt && activatedAt ? { subscriptionActivatedAt: activatedAt } : {}),
      lastPaymentEvent: isPaid ? "SYNC_PAYMENT_PAID" : "SYNC_SUBSCRIPTION_STATUS",
    },
  });
}
