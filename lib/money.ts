export const brl = (v: number | string | { toString(): string }) =>
  Number(v.toString()).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
