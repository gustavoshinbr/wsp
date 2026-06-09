import { createHash } from "crypto";
import { addMonths } from "date-fns";
import { Prisma, type SubscriptionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  isPaidAsaasPaymentStatus,
  validateAsaasWebhookToken,
  type AsaasPaymentEvent,
} from "@/lib/asaas";
import { prisma } from "@/lib/prisma";

const ACCEPTED_EVENTS = new Set([
  "PAYMENT_CREATED",
  "PAYMENT_UPDATED",
  "PAYMENT_RECEIVED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_OVERDUE",
  "PAYMENT_DELETED",
  "PAYMENT_REFUNDED",
  "SUBSCRIPTION_CREATED",
  "SUBSCRIPTION_DELETED",
  "SUBSCRIPTION_UPDATED",
]);

function validDate(value?: string | null, endOfDay = false) {
  if (!value) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T${endOfDay ? "23:59:59.999" : "12:00:00"}-03:00`)
    : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function paymentReferenceDate(payload: AsaasPaymentEvent) {
  return (
    validDate(payload.payment?.dueDate, true) ||
    validDate(payload.payment?.clientPaymentDate) ||
    validDate(payload.payment?.paymentDate)
  );
}

function paidPeriodEnd(payload: AsaasPaymentEvent) {
  const reference = paymentReferenceDate(payload);
  const nextDueDate = validDate(payload.subscription?.nextDueDate, true);

  if (nextDueDate && (!reference || nextDueDate.getTime() > reference.getTime())) {
    return nextDueDate;
  }

  return reference ? addMonths(reference, 1) : addMonths(new Date(), 1);
}

function laterDate(current: Date | null, candidate: Date) {
  return current && current.getTime() > candidate.getTime() ? current : candidate;
}

export async function POST(req: Request) {
  if (!validateAsaasWebhookToken(req.headers)) {
    return NextResponse.json({ error: "Webhook não autorizado." }, { status: 401 });
  }

  const rawPayload = await req.text();
  if (rawPayload.length > 1_000_000) {
    return NextResponse.json({ error: "Payload muito grande." }, { status: 413 });
  }

  let payload: AsaasPaymentEvent;
  try {
    payload = JSON.parse(rawPayload) as AsaasPaymentEvent;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const event = payload.event || "";
  if (!ACCEPTED_EVENTS.has(event)) {
    return NextResponse.json({ ok: true, ignored: event });
  }

  const subscriptionId = payload.payment?.subscription || payload.subscription?.id;
  const customerId = payload.payment?.customer || payload.subscription?.customer;
  const externalReference =
    payload.payment?.externalReference || payload.subscription?.externalReference;

  if (!subscriptionId && !customerId && !externalReference) {
    return NextResponse.json({ ok: true, ignored: "missing-reference" });
  }

  const workspace = await prisma.workspace.findFirst({
    where: {
      OR: [
        subscriptionId ? { asaasSubscriptionId: subscriptionId } : undefined,
        customerId ? { asaasCustomerId: customerId } : undefined,
        externalReference ? { id: externalReference } : undefined,
      ].filter(Boolean) as Array<{
        id?: string;
        asaasSubscriptionId?: string;
        asaasCustomerId?: string;
      }>,
    },
    select: {
      id: true,
      subscriptionStatus: true,
      subscriptionActivatedAt: true,
      subscriptionCurrentPeriodEnd: true,
      paymentStatus: true,
    },
  });

  if (!workspace) {
    return NextResponse.json({ ok: true, ignored: "workspace-not-found" });
  }

  const eventId =
    payload.id || createHash("sha256").update(rawPayload).digest("hex");
  const paymentStatus = String(payload.payment?.status || "").toUpperCase();
  const paid = isPaidAsaasPaymentStatus(paymentStatus);
  const paymentDate =
    validDate(payload.payment?.clientPaymentDate) ||
    validDate(payload.payment?.paymentDate) ||
    paymentReferenceDate(payload) ||
    new Date();
  const eventPeriodEnd = paidPeriodEnd(payload);
  const currentEnd = workspace.subscriptionCurrentPeriodEnd;
  const currentlyActive =
    workspace.subscriptionStatus === "ACTIVE" &&
    Boolean(currentEnd && currentEnd.getTime() > Date.now());
  const currentPaymentPaid = isPaidAsaasPaymentStatus(workspace.paymentStatus);
  const currentPaymentEvent =
    !currentEnd || eventPeriodEnd.getTime() >= currentEnd.getTime();
  const supersedesPaidPeriod =
    !currentlyActive ||
    !currentPaymentPaid ||
    !currentEnd ||
    eventPeriodEnd.getTime() > currentEnd.getTime();
  const overdueOrDeletedApplies =
    currentPaymentEvent && supersedesPaidPeriod;

  let nextStatus: SubscriptionStatus | undefined;
  if (event === "SUBSCRIPTION_DELETED") {
    nextStatus = "CANCELED";
  } else if (paid) {
    nextStatus = "ACTIVE";
  } else if (event === "PAYMENT_OVERDUE" && overdueOrDeletedApplies) {
    nextStatus = "OVERDUE";
  } else if (
    event === "PAYMENT_DELETED" &&
    overdueOrDeletedApplies
  ) {
    nextStatus = "INACTIVE";
  } else if (
    event === "PAYMENT_REFUNDED" &&
    currentPaymentEvent
  ) {
    nextStatus = "INACTIVE";
  }

  const nextPaymentStatus =
    paid ||
    event === "SUBSCRIPTION_DELETED" ||
    ((event === "PAYMENT_OVERDUE" || event === "PAYMENT_DELETED") &&
      overdueOrDeletedApplies) ||
    (event === "PAYMENT_REFUNDED" && currentPaymentEvent) ||
    !currentlyActive
      ? paymentStatus || payload.subscription?.status || event
      : workspace.paymentStatus;

  const data: Prisma.WorkspaceUpdateInput = {
    ...(subscriptionId ? { asaasSubscriptionId: subscriptionId } : {}),
    ...(customerId ? { asaasCustomerId: customerId } : {}),
    ...(nextStatus ? { subscriptionStatus: nextStatus } : {}),
    ...(paid
      ? {
          subscriptionActivatedAt:
            workspace.subscriptionActivatedAt || paymentDate,
          subscriptionCurrentPeriodEnd: laterDate(currentEnd, eventPeriodEnd),
        }
      : {}),
    paymentStatus: nextPaymentStatus,
    lastPaymentEvent: event,
  };

  try {
    await prisma.$transaction([
      prisma.asaasWebhookEvent.create({
        data: { id: eventId, event },
      }),
      prisma.workspace.update({
        where: { id: workspace.id },
        data,
      }),
    ]);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    throw error;
  }

  return NextResponse.json({ ok: true });
}
