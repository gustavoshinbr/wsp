import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { apiError } from "@/lib/validations";
import { isSubscriptionActive } from "@/lib/subscription";
import { daysUntil } from "@/lib/utils";

export async function GET() {
  try {
    const user = await requireApiUser({ allowExpiredSubscription: true });
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      workspace: {
        id: user.workspace.id,
        workshopName: user.workspace.workshopName,
        subscriptionStatus: user.workspace.subscriptionStatus,
        trialStartAt: user.workspace.trialStartAt,
        trialEndsAt: user.workspace.trialEndsAt,
        subscriptionActivatedAt: user.workspace.subscriptionActivatedAt,
        subscriptionCurrentPeriodEnd: user.workspace.subscriptionCurrentPeriodEnd,
        paymentStatus: user.workspace.paymentStatus,
        subscriptionActive: isSubscriptionActive(user.workspace),
        trialDaysRemaining: daysUntil(user.workspace.trialEndsAt),
      },
    });
  } catch (error) {
    const { message, status } = apiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
