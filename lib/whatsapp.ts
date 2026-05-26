import { brl } from "@/lib/currency";

export function whatsappUrl(phone: string | null | undefined, message: string) {
  const cleanPhone = (phone || "").replace(/\D/g, "");
  const target = cleanPhone ? `55${cleanPhone.replace(/^55/, "")}` : "";
  return `https://wa.me/${target}?text=${encodeURIComponent(message)}`;
}

export function quoteWhatsAppMessage(input: {
  workshopName: string;
  clientName: string;
  motorcycle?: string | null;
  items: Array<{ description: string; quantity: number; total: number }>;
  total: number;
}) {
  const items = input.items
    .map((item) => `- ${item.quantity}x ${item.description}: ${brl(item.total)}`)
    .join("\n");

  return [
    `Olá, ${input.clientName}!`,
    `Segue o orçamento da ${input.workshopName}.`,
    input.motorcycle ? `Moto: ${input.motorcycle}` : "",
    "",
    items,
    "",
    `Total: ${brl(input.total)}`,
    "Responda esta mensagem para aprovar o serviço.",
  ]
    .filter(Boolean)
    .join("\n");
}
