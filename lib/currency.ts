import type { Prisma } from "@prisma/client";

export function toNumber(value: number | string | Prisma.Decimal | null | undefined) {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return Number(value);
}

export function brl(value: number | string | Prisma.Decimal | null | undefined) {
  return toNumber(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function percent(value: number) {
  return `${value.toFixed(1).replace(".", ",")}%`;
}
