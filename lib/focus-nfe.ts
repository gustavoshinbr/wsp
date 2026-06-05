import { ApiError } from "@/lib/validations";

export type FocusEnvironment = "homologacao" | "producao";

export type FocusNfceResponse = {
  ref?: string;
  status?: string;
  status_sefaz?: unknown;
  mensagem_sefaz?: unknown;
  chave_nfe?: unknown;
  numero?: unknown;
  serie?: unknown;
  caminho_xml_nota_fiscal?: unknown;
  caminho_danfe?: unknown;
  qrcode_url?: unknown;
  url_consulta_nf?: unknown;
  numero_protocolo?: unknown;
  [key: string]: unknown;
};

function token() {
  return process.env.FOCUS_NFE_TOKEN?.trim() || "";
}

export function focusNfeConfigured() {
  return Boolean(token());
}

export function focusBaseUrl(environment: FocusEnvironment) {
  return environment === "producao"
    ? "https://api.focusnfe.com.br"
    : "https://homologacao.focusnfe.com.br";
}

export function optionalFocusText(value: unknown) {
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
}

export function absoluteFocusUrl(environment: FocusEnvironment, value?: unknown) {
  const text = optionalFocusText(value);
  if (!text) return null;
  if (/^https?:\/\//i.test(text)) return text;
  return new URL(text, focusBaseUrl(environment)).toString();
}

function focusErrorMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== "object") return fallback;
  const record = body as Record<string, unknown>;
  const errors = Array.isArray(record.erros)
    ? record.erros
        .map((error) => {
          if (!error || typeof error !== "object") return "";
          const item = error as Record<string, unknown>;
          return String(item.mensagem || item.message || "").trim();
        })
        .filter(Boolean)
        .join(" ")
    : "";
  return String(record.mensagem || record.message || errors || fallback);
}

export async function focusRequest<T>(
  environment: FocusEnvironment,
  path: string,
  init: RequestInit = {},
) {
  const apiToken = token();
  if (!apiToken) {
    throw new ApiError("Integração fiscal não configurada. Defina FOCUS_NFE_TOKEN na Vercel.");
  }

  const response = await fetch(`${focusBaseUrl(environment)}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${apiToken}:`).toString("base64")}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  const text = await response.text();
  let body: unknown = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { message: text };
    }
  }

  if (!response.ok) {
    throw new ApiError(
      focusErrorMessage(body, `A Focus NFe recusou a solicitação (HTTP ${response.status}).`),
      response.status >= 500 ? 502 : 400,
    );
  }

  return body as T;
}

export function focusDocumentStatus(status?: string | null) {
  if (status === "autorizado") return "AUTHORIZED" as const;
  if (status === "cancelado") return "CANCELLED" as const;
  if (status === "processando_autorizacao") return "PROCESSING" as const;
  if (status === "erro_autorizacao" || status === "denegado") return "REJECTED" as const;
  return "ERROR" as const;
}

export function focusPaymentCode(method?: string | null) {
  const normalized = (method || "").toLocaleLowerCase("pt-BR");
  if (normalized.includes("dinheiro")) return "01";
  if (normalized.includes("crédito") || normalized.includes("credito")) return "03";
  if (normalized.includes("débito") || normalized.includes("debito")) return "04";
  if (normalized.includes("pix")) return "17";
  if (normalized.includes("prazo")) return "91";
  return "99";
}
