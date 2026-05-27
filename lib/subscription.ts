import type { Workspace } from "@prisma/client";
import { redirect } from "next/navigation";
import { isPaidAsaasPaymentStatus } from "@/lib/asaas";
import { ApiError } from "@/lib/validations";
import { daysUntil } from "@/lib/utils";

export const ACTIVE_SUBSCRIPTION_STATUSES = ["ACTIVE"] as const;

export function isTrialActive(workspace: Pick<Workspace, "trialEndsAt" | "subscriptionStatus">) {
  return workspace.trialEndsAt.getTime() >= Date.now();
}

export function isSubscriptionActive(workspace: Pick<Workspace, "subscriptionStatus"> & Partial<Pick<Workspace, "paymentStatus">>) {
  return ACTIVE_SUBSCRIPTION_STATUSES.includes(workspace.subscriptionStatus as "ACTIVE") || isPaidAsaasPaymentStatus(workspace.paymentStatus);
}

export function hasWorkspaceAccess(workspace: Pick<Workspace, "trialEndsAt" | "subscriptionStatus"> & Partial<Pick<Workspace, "paymentStatus">>) {
  return isTrialActive(workspace) || isSubscriptionActive(workspace);
}

export function subscriptionMessage(workspace: Pick<Workspace, "trialEndsAt" | "subscriptionStatus"> & Partial<Pick<Workspace, "paymentStatus">>) {
  if (isSubscriptionActive(workspace)) return "Assinatura ativa.";
  if (isTrialActive(workspace)) return `Teste grátis: restam ${daysUntil(workspace.trialEndsAt)} dias.`;
  if (workspace.subscriptionStatus === "OVERDUE") return "Pagamento em atraso. Regularize sua assinatura.";
  if (workspace.subscriptionStatus === "CANCELED") return "Assinatura cancelada. Gere uma nova assinatura para continuar.";
  if (workspace.subscriptionStatus === "INACTIVE") return "Assinatura pendente. Conclua o pagamento para liberar o acesso.";
  return "Ative sua assinatura para continuar usando o WSP Racing.";
}

export function requireWorkspaceAccess(workspace: Pick<Workspace, "trialEndsAt" | "subscriptionStatus"> & Partial<Pick<Workspace, "paymentStatus">>) {
  if (!hasWorkspaceAccess(workspace)) redirect("/assinatura");
}

export function requireApiWorkspaceAccess(workspace: Pick<Workspace, "trialEndsAt" | "subscriptionStatus"> & Partial<Pick<Workspace, "paymentStatus">>) {
  if (!hasWorkspaceAccess(workspace)) {
    throw new ApiError("Assinatura obrigatória para continuar.", 402);
  }
}
