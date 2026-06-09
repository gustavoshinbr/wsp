import { Prisma } from "@prisma/client";
import { onlyDigits } from "@/lib/utils";

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string) {
  return password.length >= 8;
}

export function validateCpfCnpj(value: string) {
  const digits = onlyDigits(value);
  return digits.length === 11 || digits.length === 14;
}

export function validatePhone(value: string) {
  const digits = onlyDigits(value);
  return digits.length === 10 || digits.length === 11;
}

export function assertRequired(value: string, label: string) {
  if (!value.trim()) throw new Error(`${label} é obrigatório.`);
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function apiError(error: unknown) {
  if (error instanceof ApiError) {
    return { message: error.message, status: error.status };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return { message: "Já existe um registro com esses dados.", status: 409 };
    if (error.code === "P2003") {
      return { message: "Este registro está em uso e não pode ser excluído.", status: 409 };
    }
    if (error.code === "P2025") return { message: "Registro não encontrado.", status: 404 };
  }

  if (error instanceof Error) {
    console.error("Erro interno de API", error);
    return { message: "Não foi possível concluir a operação.", status: 500 };
  }

  return { message: "Erro inesperado.", status: 500 };
}
