import { addMonths } from "date-fns";
import {
  getAsaasSubscription,
  getPreferredSubscriptionPayment,
  getSubscriptionPayments,
  isPaidAsaasPaymentStatus,
  type AsaasPayment,
  type AsaasSubscription,
} from "@/lib/asaas";
import { prisma } from "@/lib/prisma";
import { isTrialActive } from "@/lib/subscription";

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

function paymentDueTime(payment: AsaasPayment) {
  return payment.dueDate ? new Date(payment.dueDate).getTime() : 0;
}

function nextPaymentAfter(payments: AsaasPayment[], payment: AsaasPayment) {
  const paidDueTime = paymentDueTime(payment);
  return payments
    .filter((candidate) => paymentDueTime(candidate) > paidDueTime)
    .sort((a, b) => paymentDueTime(a) - paymentDueTime(b))[0] || null;
}

function latestOverduePayment(payments: AsaasPayment[]) {
  return payments
    .filter((payment) => String(payment.status || "").toUpperCase() === "OVERDUE")
    .sort((a, b) => paymentTime(b) - paymentTime(a))[0] || null;
}

function paidAtFromPayment(payment?: AsaasPayment | null) {
  const date = payment?.clientPaymentDate || payment?.paymentDate || payment?.dueDate;
  return date ? new Date(date) : new Date();
}

function periodEndFromPaidPayment(input: {
  subscription?: AsaasSubscription | null;
  payments: AsaasPayment[];
  paidPayment: AsaasPayment;
}) {
  const nextPayment = nextPaymentAfter(input.payments, input.paidPayment);
  if (nextPayment?.dueDate) return new Date(nextPayment.dueDate);

  const paidDueTime = paymentDueTime(input.paidPayment);
  const subscriptionDueTime = input.subscription?.nextDueDate
    ? new Date(input.subscription.nextDueDate).getTime()
    : 0;
  if (subscriptionDueTime > paidDueTime) return new Date(input.subscription!.nextDueDate!);

  const paidPeriodStart =
    input.paidPayment.dueDate ||
    input.paidPayment.clientPaymentDate ||
    input.paidPayment.paymentDate;
  return paidPeriodStart ? addMonths(new Date(paidPeriodStart), 1) : undefined;
}

function pendingPeriodEnd(input: {
  subscription?: AsaasSubscription | null;
  payments: AsaasPayment[];
}) {
  const futurePayment = nearestFuturePayment(input.payments);
  if (futurePayment?.dueDate) return new Date(futurePayment.dueDate);
  return input.subscription?.nextDueDate ? new Date(input.subscription.nextDueDate) : undefined;
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

  const [subscriptionResult, paymentsResult] = await Promise.allSettled([
    getAsaasSubscription(workspace.asaasSubscriptionId),
    getSubscriptionPayments(workspace.asaasSubscriptionId),
  ]);
  if (paymentsResult.status === "rejected") return workspace;

  const subscription = subscriptionResult.status === "fulfilled" ? subscriptionResult.value : null;
  const payments = paymentsResult.value;
  const payment = getPreferredSubscriptionPayment(payments);
  const paidPayment = latestPaidPayment(payments);
  const overduePayment = latestOverduePayment(payments);
  const isPaid = Boolean(paidPayment);
  const subscriptionStatus = String(subscription?.status || "").toUpperCase();
  const paymentStatus = String(overduePayment?.status || payment?.status || "").toUpperCase();
  const paidPeriodEnd = paidPayment
    ? periodEndFromPaidPayment({ subscription, payments, paidPayment })
    : undefined;
  const periodEnd = paidPeriodEnd || pendingPeriodEnd({ subscription, payments });
  const paidPeriodActive = Boolean(paidPeriodEnd && paidPeriodEnd.getTime() > Date.now());
  const effectivePayment = paidPeriodActive ? paidPayment : overduePayment || payment;
  const isCanceledSubscription = subscriptionStatus === "DELETED" || subscriptionStatus === "CANCELED";
  const activatedAt = activatedAtFromAsaas({ subscription, paidPayment });
  const trialActive = isTrialActive(workspace);

  const nextStatus =
    isCanceledSubscription
      ? "CANCELED"
      : isPaid && paidPeriodActive
      ? "ACTIVE"
      : trialActive
        ? "TRIAL"
        : paymentStatus === "OVERDUE"
        ? "OVERDUE"
        : "INACTIVE";

  return prisma.workspace.update({
    where: { id: workspace.id },
    data: {
      subscriptionStatus: nextStatus,
      paymentStatus: effectivePayment?.status || subscription?.status || workspace.paymentStatus,
      ...(periodEnd ? { subscriptionCurrentPeriodEnd: periodEnd } : {}),
      ...(isPaid && !workspace.subscriptionActivatedAt
        ? { subscriptionActivatedAt: activatedAt || new Date() }
        : {}),
      lastPaymentEvent: isPaid ? "SYNC_PAYMENT_PAID" : "SYNC_SUBSCRIPTION_STATUS",
    },
  });
}
