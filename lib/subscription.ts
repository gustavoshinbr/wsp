import type { Workspace } from "@prisma/client";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/validations";
import { daysUntil } from "@/lib/utils";

export const ACTIVE_SUBSCRIPTION_STATUSES = ["ACTIVE"] as const;

export function isTrialActive(workspace: Pick<Workspace, "trialEndsAt" | "subscriptionStatus">) {
  return workspace.trialEndsAt.getTime() >= Date.now();
}

export function isSubscriptionActive(workspace: Pick<Workspace, "subscriptionStatus">) {
  return ACTIVE_SUBSCRIPTION_STATUSES.includes(workspace.subscriptionStatus as "ACTIVE");
}

export function hasWorkspaceAccess(workspace: Pick<Workspace, "trialEndsAt" | "subscriptionStatus">) {
  return isTrialActive(workspace) || isSubscriptionActive(workspace);
}

export function subscriptionMessage(workspace: Pick<Workspace, "trialEndsAt" | "subscriptionStatus">) {
  if (isSubscriptionActive(workspace)) return "Assinatura ativa.";
  if (isTrialActive(workspace)) return `Teste gratis: restam ${daysUntil(workspace.trialEndsAt)} dias.`;
  if (workspace.subscriptionStatus === "OVERDUE") return "Pagamento em atraso. Regularize sua assinatura.";
  if (workspace.subscriptionStatus === "CANCELED") return "Assinatura cancelada. Gere uma nova assinatura para continuar.";
  if (workspace.subscriptionStatus === "INACTIVE") return "Assinatura pendente. Conclua o pagamento para liberar o acesso.";
  return "Ative sua assinatura para continuar usando o WSP Racing.";
}

export function requireWorkspaceAccess(workspace: Pick<Workspace, "trialEndsAt" | "subscriptionStatus">) {
  if (!hasWorkspaceAccess(workspace)) redirect("/assinatura");
}

export function requireApiWorkspaceAccess(workspace: Pick<Workspace, "trialEndsAt" | "subscriptionStatus">) {
  if (!hasWorkspaceAccess(workspace)) {
    throw new ApiError("Assinatura obrigatoria para continuar.", 402);
  }
}
