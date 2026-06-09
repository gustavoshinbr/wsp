import Link from "next/link";
import { Card } from "@/components/Card";
import { hasWorkspaceAccess, subscriptionMessage } from "@/lib/subscription";
import type { Workspace } from "@prisma/client";

export function SubscriptionGuard({
  workspace,
  children,
}: {
  workspace: Pick<Workspace, "trialEndsAt" | "subscriptionStatus" | "subscriptionCurrentPeriodEnd">;
  children: React.ReactNode;
}) {
  if (hasWorkspaceAccess(workspace)) return <>{children}</>;

  return (
    <Card className="mx-auto max-w-xl text-center">
      <h1 className="text-2xl font-black">Assinatura necessária</h1>
      <p className="mt-3 text-racing-muted">{subscriptionMessage(workspace)}</p>
      <Link
        href="/assinatura"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-racing-red px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
      >
        Ativar assinatura
      </Link>
    </Card>
  );
}
