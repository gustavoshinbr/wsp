import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizeDocument(value: string) {
  return onlyDigits(value);
}

export function normalizePhone(value: string) {
  return onlyDigits(value);
}

export function optionalString(value: unknown) {
  const parsed = String(value ?? "").trim();
  return parsed.length ? parsed : null;
}

export function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export function formNumber(formData: FormData, key: string, fallback = 0) {
  const raw = String(formData.get(key) ?? "").replace(",", ".").trim();
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function formInt(formData: FormData, key: string, fallback = 0) {
  const parsed = parseInt(String(formData.get(key) ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function positiveInteger(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 1_000_000 ? parsed : null;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function daysUntil(date: Date) {
  const diff = date.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

export function dateTimeLocalValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function absoluteUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return new URL(path, base).toString();
}
