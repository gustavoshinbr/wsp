import type { Workspace } from "@prisma/client";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/validations";
import { daysUntil } from "@/lib/utils";

export const ACTIVE_SUBSCRIPTION_STATUSES = ["ACTIVE"] as const;
export const TRIAL_DURATION_DAYS = 7;
const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

export function trialEndsAtFrom(startAt: Date) {
  return new Date(startAt.getTime() + TRIAL_DURATION_MS);
}

export function isTrialActive(workspace: Pick<Workspace, "trialEndsAt" | "subscriptionStatus">) {
  return workspace.trialEndsAt.getTime() > Date.now();
}

export function isSubscriptionActive(
  workspace: Pick<Workspace, "subscriptionStatus" | "subscriptionCurrentPeriodEnd">,
) {
  return (
    ACTIVE_SUBSCRIPTION_STATUSES.includes(workspace.subscriptionStatus as "ACTIVE") &&
    Boolean(workspace.subscriptionCurrentPeriodEnd) &&
    workspace.subscriptionCurrentPeriodEnd!.getTime() > Date.now()
  );
}

export function hasWorkspaceAccess(
  workspace: Pick<Workspace, "trialEndsAt" | "subscriptionStatus" | "subscriptionCurrentPeriodEnd">,
) {
  return isTrialActive(workspace) || isSubscriptionActive(workspace);
}

export function subscriptionMessage(
  workspace: Pick<Workspace, "trialEndsAt" | "subscriptionStatus" | "subscriptionCurrentPeriodEnd">,
) {
  if (isSubscriptionActive(workspace)) return "Assinatura ativa.";
  if (isTrialActive(workspace)) return `Teste grátis: restam ${daysUntil(workspace.trialEndsAt)} dias.`;
  if (workspace.subscriptionStatus === "OVERDUE") return "Pagamento em atraso. Regularize sua assinatura.";
  if (workspace.subscriptionStatus === "CANCELED") return "Assinatura cancelada. Gere uma nova assinatura para continuar.";
  if (workspace.subscriptionStatus === "INACTIVE") return "Assinatura pendente. Conclua o pagamento para liberar o acesso.";
  return "Ative sua assinatura para continuar usando o WSP Racing.";
}

export function requireWorkspaceAccess(
  workspace: Pick<Workspace, "trialEndsAt" | "subscriptionStatus" | "subscriptionCurrentPeriodEnd">,
) {
  if (!hasWorkspaceAccess(workspace)) redirect("/assinatura");
}

export function requireApiWorkspaceAccess(
  workspace: Pick<Workspace, "trialEndsAt" | "subscriptionStatus" | "subscriptionCurrentPeriodEnd">,
) {
  if (!hasWorkspaceAccess(workspace)) {
    throw new ApiError("Assinatura obrigatória para continuar.", 402);
  }
}
