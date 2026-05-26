import { NextResponse } from "next/server";
import { createAsaasCustomer, createAsaasSubscription } from "@/lib/asaas";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";
import { apiError } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const user = await requireApiUser({ allowExpiredSubscription: true });
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
    }

    const result = await createAsaasSubscription({
      customerId,
      value: Number(process.env.ASAAS_PLAN_VALUE || 50),
      externalReference: user.workspace.id,
      description: "Assinatura mensal WSP Racing Pro",
    });

    const workspace = await prisma.workspace.update({
      where: { id: user.workspaceId },
      data: {
        asaasCustomerId: customerId,
        asaasSubscriptionId: result.subscription.id,
        subscriptionStatus: "INACTIVE",
        paymentStatus: result.payment?.status || "AWAITING_PAYMENT",
        subscriptionCurrentPeriodEnd: result.currentPeriodEnd,
        lastPaymentEvent: "SUBSCRIPTION_CREATED",
      },
    });

    setSessionCookie({
      userId: user.id,
      workspaceId: workspace.id,
      email: user.email,
      remember: true,
      subscriptionStatus: workspace.subscriptionStatus,
      trialEndsAt: workspace.trialEndsAt,
    });

    const acceptsJson = req.headers.get("accept")?.includes("application/json");
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
