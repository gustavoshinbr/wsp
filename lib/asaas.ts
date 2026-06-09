import { addMonths, format } from "date-fns";
import { timingSafeEqual } from "crypto";
import { absoluteUrl } from "@/lib/utils";
import { ApiError } from "@/lib/validations";

type AsaasCustomerInput = {
  name: string;
  email: string;
  phone?: string | null;
  cpfCnpj: string;
  externalReference?: string;
};

type AsaasSubscriptionInput = {
  customerId: string;
  value?: number;
  description?: string;
  externalReference?: string;
  nextDueDate?: Date;
  callbackSuccessUrl?: string;
};

export type AsaasPayment = {
  id: string;
  status?: string;
  invoiceUrl?: string;
  dueDate?: string;
  paymentDate?: string;
  clientPaymentDate?: string;
};

export type AsaasSubscription = {
  id: string;
  status?: string;
  nextDueDate?: string;
  dateCreated?: string;
};

export type AsaasPaymentEvent = {
  id?: string;
  event?: string;
  payment?: {
    id?: string;
    customer?: string;
    subscription?: string;
    status?: string;
    dueDate?: string;
    paymentDate?: string;
    clientPaymentDate?: string;
    invoiceUrl?: string;
    externalReference?: string;
  };
  subscription?: {
    id?: string;
    customer?: string;
    status?: string;
    nextDueDate?: string;
    externalReference?: string;
  };
};

const DEFAULT_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://sandbox.asaas.com/api/v3";
const PAID_PAYMENT_STATUSES = new Set(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]);

export function asaasBaseUrl() {
  return (process.env.ASAAS_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
}

function requireApiKey() {
  const key = process.env.ASAAS_API_KEY;
  if (!key) throw new Error("ASAAS_API_KEY não configurada.");
  return key;
}

export async function asaasRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${asaasBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: requireApiKey(),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const description =
      data?.errors?.[0]?.description ||
      data?.message ||
      `Erro Asaas (${response.status})`;
    throw new ApiError(description, response.status >= 500 ? 502 : 400);
  }

  return data as T;
}

export async function createAsaasCustomer(input: AsaasCustomerInput) {
  return asaasRequest<{ id: string }>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      phone: input.phone || undefined,
      mobilePhone: input.phone || undefined,
      cpfCnpj: input.cpfCnpj,
      externalReference: input.externalReference,
    }),
  });
}

export async function createAsaasSubscription(input: AsaasSubscriptionInput) {
  const value = input.value ?? Number(process.env.ASAAS_PLAN_VALUE || 50);
  const nextDueDate = input.nextDueDate ?? new Date();
  const payload = {
    customer: input.customerId,
    billingType: "UNDEFINED",
    value,
    nextDueDate: format(nextDueDate, "yyyy-MM-dd"),
    cycle: "MONTHLY",
    description: input.description || "Assinatura WSP Racing Pro",
    externalReference: input.externalReference,
  };
  const requestSubscription = (includeCallback: boolean) => asaasRequest<{
    id: string;
    status?: string;
    invoiceUrl?: string;
    paymentLink?: string;
  }>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      ...(includeCallback
        ? {
            callback: {
              successUrl: input.callbackSuccessUrl || absoluteUrl("/api/asaas/return"),
              autoRedirect: true,
            },
          }
        : {}),
    }),
  });
  let subscription;
  try {
    subscription = await requestSubscription(true);
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (!message.includes("domínio configurado") && !message.includes("dominio configurado")) throw error;
    subscription = await requestSubscription(false);
  }

  const payment = await getCurrentSubscriptionPayment(subscription.id).catch(() => null);

  return {
    subscription,
    payment,
    paymentLink: paymentUrlWithAutoRedirect(
      payment?.invoiceUrl || subscription.paymentLink || subscription.invoiceUrl || null,
    ),
    currentPeriodEnd: addMonths(nextDueDate, 1),
  };
}

export async function updateAsaasSubscriptionCallback(id: string, callbackSuccessUrl?: string) {
  return asaasRequest<{ id: string; status?: string }>(`/subscriptions/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      callback: {
        successUrl: callbackSuccessUrl || absoluteUrl("/api/asaas/return"),
        autoRedirect: true,
      },
      updatePendingPayments: true,
    }),
  });
}

export async function getAsaasSubscription(id: string) {
  return asaasRequest<AsaasSubscription>(`/subscriptions/${id}`);
}

export async function cancelAsaasSubscription(id: string) {
  return asaasRequest<{ id: string; deleted?: boolean }>(`/subscriptions/${id}`, {
    method: "DELETE",
  });
}

export async function getSubscriptionPayments(subscriptionId: string, limit = 20) {
  const data = await asaasRequest<{
    data?: AsaasPayment[];
  }>(`/payments?subscription=${encodeURIComponent(subscriptionId)}&limit=${limit}`);

  return data.data || [];
}

function paymentTime(payment: AsaasPayment) {
  const date = payment.clientPaymentDate || payment.paymentDate || payment.dueDate;
  return date ? new Date(date).getTime() : 0;
}

function isFutureOrToday(date?: string | null) {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date).getTime() >= today.getTime();
}

export function getPreferredSubscriptionPayment(payments: AsaasPayment[]) {
  const paidPayment = payments
    .filter((payment) => isPaidAsaasPaymentStatus(payment.status))
    .sort((a, b) => paymentTime(b) - paymentTime(a))[0];

  if (paidPayment) return paidPayment;

  const pendingPayment = payments
    .filter((payment) => payment.status === "PENDING" && isFutureOrToday(payment.dueDate))
    .sort((a, b) => paymentTime(a) - paymentTime(b))[0];

  if (pendingPayment) return pendingPayment;

  return payments.sort((a, b) => paymentTime(b) - paymentTime(a))[0] || null;
}

export async function getCurrentSubscriptionPayment(subscriptionId: string) {
  return getPreferredSubscriptionPayment(await getSubscriptionPayments(subscriptionId));
}

export async function getFirstSubscriptionPayment(subscriptionId: string) {
  return getCurrentSubscriptionPayment(subscriptionId);
}

export function isPaidAsaasPaymentStatus(status?: string | null) {
  return PAID_PAYMENT_STATUSES.has(String(status || "").toUpperCase());
}

export function paymentUrlWithAutoRedirect(url?: string | null) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    parsed.searchParams.set("autoRedirect", "true");
    return parsed.toString();
  } catch {
    return url;
  }
}

export function validateAsaasWebhookToken(headers: Headers) {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expected) return false;

  const received =
    headers.get("asaas-access-token") ||
    headers.get("access_token") ||
    headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}
