import { addDays, format } from "date-fns";

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
  };
  subscription?: {
    id?: string;
    customer?: string;
    status?: string;
    nextDueDate?: string;
  };
};

const DEFAULT_BASE_URL = "https://sandbox.asaas.com/api/v3";

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
    throw new Error(description);
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

  const subscription = await asaasRequest<{
    id: string;
    invoiceUrl?: string;
    paymentLink?: string;
  }>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: input.customerId,
      billingType: "UNDEFINED",
      value,
      nextDueDate: format(nextDueDate, "yyyy-MM-dd"),
      cycle: "MONTHLY",
      description: input.description || "Assinatura WSP Racing Pro",
      externalReference: input.externalReference,
    }),
  });

  const payment = await getFirstSubscriptionPayment(subscription.id).catch(() => null);

  return {
    subscription,
    payment,
    paymentLink: payment?.invoiceUrl || subscription.paymentLink || subscription.invoiceUrl || null,
    currentPeriodEnd: addDays(nextDueDate, 30),
  };
}

export async function getAsaasSubscription(id: string) {
  return asaasRequest<{ id: string; status?: string; nextDueDate?: string }>(`/subscriptions/${id}`);
}

export async function cancelAsaasSubscription(id: string) {
  return asaasRequest<{ id: string; deleted?: boolean }>(`/subscriptions/${id}`, {
    method: "DELETE",
  });
}

export async function getFirstSubscriptionPayment(subscriptionId: string) {
  const data = await asaasRequest<{
    data?: Array<{ id: string; status?: string; invoiceUrl?: string; dueDate?: string }>;
  }>(`/payments?subscription=${encodeURIComponent(subscriptionId)}&limit=1`);

  return data.data?.[0] || null;
}

export function validateAsaasWebhookToken(headers: Headers) {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expected) return false;

  const received =
    headers.get("asaas-access-token") ||
    headers.get("access_token") ||
    headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";

  return received === expected;
}
