import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { isSubscriptionActive } from "@/lib/subscription";

function redirectTo(path: string, req: Request) {
  return NextResponse.redirect(new URL(path, req.url), { status: 303 });
}

export async function GET(req: Request) {
  try {
    const user = await requireApiUser({ allowExpiredSubscription: true });
    const subscriptionId = user.workspace.asaasSubscriptionId;

    if (!subscriptionId) return redirectTo("/assinatura", req);

    if (isSubscriptionActive(user.workspace)) return redirectTo("/dashboard", req);
    return redirectTo("/assinatura?error=Pagamento recebido. Aguardando confirmação automática do Asaas.", req);
  } catch {
    return redirectTo("/login", req);
  }
}
