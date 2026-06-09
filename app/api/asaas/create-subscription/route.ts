import { NextResponse } from "next/server";
import {
  createAsaasCustomer,
  createAsaasSubscription,
  getCurrentSubscriptionPayment,
  paymentUrlWithAutoRedirect,
  updateAsaasSubscriptionCallback,
} from "@/lib/asaas";
import { requireApiUser, requireManager } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";
import { isSubscriptionActive, isTrialActive } from "@/lib/subscription";
import { apiError } from "@/lib/validations";

function redirectToPayment(req: Request, subscriptionId: string, paymentLink?: string | null) {
  if (paymentLink) return NextResponse.redirect(paymentLink);

  const url = new URL("/checkout", req.url);
  url.searchParams.set("subscription", subscriptionId);
  return NextResponse.redirect(url);
}

export async function POST(req: Request) {
  try {
    const user = await requireApiUser({ allowExpiredSubscription: true });
    requireManager(user.role);
    const acceptsJson = req.headers.get("accept")?.includes("application/json");
    const callbackSuccessUrl = new URL("/api/asaas/return", req.url).toString();

    if (isSubscriptionActive(user.workspace)) {
      if (acceptsJson) return NextResponse.json({ active: true });
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (user.workspace.asaasSubscriptionId && user.workspace.subscriptionStatus !== "CANCELED") {
      await updateAsaasSubscriptionCallback(user.workspace.asaasSubscriptionId, callbackSuccessUrl).catch(() => null);
      const payment = await getCurrentSubscriptionPayment(user.workspace.asaasSubscriptionId).catch(() => null);

      if (acceptsJson) {
        return NextResponse.json({
          subscriptionId: user.workspace.asaasSubscriptionId,
          paymentLink: paymentUrlWithAutoRedirect(payment?.invoiceUrl || null),
          reused: true,
        });
      }

      return redirectToPayment(
        req,
        user.workspace.asaasSubscriptionId,
        paymentUrlWithAutoRedirect(payment?.invoiceUrl || null),
      );
    }

    let customerId = user.workspace.asaasCustomerId;

    if (!customerId) {
      const customer = await createAsaasCustomer({
        name: user.workspace.workshopName,
        email: user.workspace.email,
        phone: user.workspace.phone,
        cpfCnpj: user.workspace.document,
        externalReference: user.workspace.id,
      });
      customerId = customer.id;
      await prisma.workspace.update({
        where: { id: user.workspaceId },
        data: { asaasCustomerId: customerId },
      });
    }

    const result = await createAsaasSubscription({
      customerId,
      value: Number(process.env.ASAAS_PLAN_VALUE || 50),
      externalReference: user.workspace.id,
      description: "Assinatura mensal WSP Racing Pro",
      callbackSuccessUrl,
    });

    const workspace = await prisma.workspace.update({
      where: { id: user.workspaceId },
      data: {
        asaasCustomerId: customerId,
        asaasSubscriptionId: result.subscription.id,
        subscriptionStatus: isTrialActive(user.workspace) ? "TRIAL" : "INACTIVE",
        paymentStatus: result.payment?.status || "AWAITING_PAYMENT",
        lastPaymentEvent: "SUBSCRIPTION_CREATED",
      },
    });

    await setSessionCookie({
      userId: user.id,
      workspaceId: workspace.id,
      email: user.email,
      remember: true,
      subscriptionStatus: workspace.subscriptionStatus,
      trialEndsAt: workspace.trialEndsAt,
    });

    if (acceptsJson) {
      return NextResponse.json({
        subscriptionId: result.subscription.id,
        paymentLink: result.paymentLink,
      });
    }

    if (result.paymentLink) return NextResponse.redirect(result.paymentLink);

    const url = new URL("/checkout", req.url);
    url.searchParams.set("subscription", result.subscription.id);
    return NextResponse.redirect(url);
  } catch (error) {
    const { message, status } = apiError(error);
    const acceptsJson = req.headers.get("accept")?.includes("application/json");
    if (acceptsJson) return NextResponse.json({ error: message }, { status });
    const url = new URL("/assinatura", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
  }
}
