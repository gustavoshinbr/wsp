import { addDays } from "date-fns";
import { NextResponse } from "next/server";
import { type SubscriptionStatus } from "@prisma/client";
import { validateAsaasWebhookToken, type AsaasPaymentEvent } from "@/lib/asaas";
import { prisma } from "@/lib/prisma";

const EVENT_TO_STATUS: Record<string, SubscriptionStatus> = {
  PAYMENT_RECEIVED: "ACTIVE",
  PAYMENT_CONFIRMED: "ACTIVE",
  PAYMENT_OVERDUE: "OVERDUE",
  PAYMENT_DELETED: "INACTIVE",
  PAYMENT_REFUNDED: "INACTIVE",
  SUBSCRIPTION_DELETED: "CANCELED",
};

const ACCEPTED_EVENTS = new Set([
  "PAYMENT_RECEIVED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_OVERDUE",
  "PAYMENT_DELETED",
  "PAYMENT_REFUNDED",
  "SUBSCRIPTION_CREATED",
  "SUBSCRIPTION_DELETED",
  "SUBSCRIPTION_UPDATED",
]);

function periodEndFromEvent(payload: AsaasPaymentEvent) {
  const date =
    payload.subscription?.nextDueDate ||
    payload.payment?.clientPaymentDate ||
    payload.payment?.paymentDate ||
    payload.payment?.dueDate;

  if (!date) return undefined;
  return addDays(new Date(date), 30);
}

export async function POST(req: Request) {
  if (!validateAsaasWebhookToken(req.headers)) {
    return NextResponse.json({ error: "Webhook não autorizado." }, { status: 401 });
  }

  const payload = (await req.json()) as AsaasPaymentEvent;
  const event = payload.event || "";

  if (!ACCEPTED_EVENTS.has(event)) {
    return NextResponse.json({ ok: true, ignored: event });
  }

  const subscriptionId = payload.payment?.subscription || payload.subscription?.id;
  const customerId = payload.payment?.customer || payload.subscription?.customer;

  if (!subscriptionId && !customerId) {
    return NextResponse.json({ ok: true, ignored: "missing-reference" });
  }

  const status = EVENT_TO_STATUS[event];
  const data = {
    ...(subscriptionId ? { asaasSubscriptionId: subscriptionId } : {}),
    ...(status ? { subscriptionStatus: status } : {}),
    ...(periodEndFromEvent(payload) ? { subscriptionCurrentPeriodEnd: periodEndFromEvent(payload) } : {}),
    paymentStatus: payload.payment?.status || payload.subscription?.status || event,
    lastPaymentEvent: event,
  };

  const workspace = await prisma.workspace.findFirst({
    where: {
      OR: [
        subscriptionId ? { asaasSubscriptionId: subscriptionId } : undefined,
        customerId ? { asaasCustomerId: customerId } : undefined,
      ].filter(Boolean) as Array<{ asaasSubscriptionId?: string; asaasCustomerId?: string }>,
    },
    select: { id: true },
  });

  if (workspace) {
    await prisma.workspace.update({ where: { id: workspace.id }, data });
  }

  return NextResponse.json({ ok: true });
}
