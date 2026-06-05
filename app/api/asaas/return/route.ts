import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";
import { syncWorkspaceSubscription } from "@/lib/subscription-sync";

function redirectTo(path: string, req: Request) {
  return NextResponse.redirect(new URL(path, req.url), { status: 303 });
}

export async function GET(req: Request) {
  try {
    const user = await requireApiUser({ allowExpiredSubscription: true });
    const subscriptionId = user.workspace.asaasSubscriptionId;

    if (!subscriptionId) return redirectTo("/assinatura", req);

    const workspace = await syncWorkspaceSubscription(user.workspaceId);
    if (!workspace) return redirectTo("/assinatura", req);

    await setSessionCookie({
      userId: user.id,
      workspaceId: workspace.id,
      email: user.email,
      remember: true,
      subscriptionStatus: workspace.subscriptionStatus,
      trialEndsAt: workspace.trialEndsAt,
    });

    if (workspace.subscriptionStatus === "ACTIVE") return redirectTo("/dashboard", req);
    return redirectTo("/assinatura?error=Pagamento ainda não confirmado. Aguarde alguns segundos.", req);
  } catch {
    return redirectTo("/login", req);
  }
}
