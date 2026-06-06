import { NextResponse } from "next/server";
import { addDays, format } from "date-fns";
import { asaasRequest } from "@/lib/asaas";
import { requireApiUser, requireManager } from "@/lib/auth";
import { absoluteUrl } from "@/lib/utils";
import { apiError } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const user = await requireApiUser({ allowExpiredSubscription: true });
    requireManager(user.role);
    const checkout = await asaasRequest<{ id: string; link?: string; url?: string }>("/checkouts", {
      method: "POST",
      body: JSON.stringify({
        billingTypes: ["CREDIT_CARD", "PIX"],
        chargeTypes: ["RECURRENT"],
        minutesToExpire: 60,
        callback: {
          successUrl: new URL("/api/asaas/return", req.url).toString(),
          cancelUrl: absoluteUrl("/assinatura"),
          expiredUrl: absoluteUrl("/assinatura"),
        },
        items: [
          {
            name: "WSP Racing Pro",
            description: "Assinatura mensal do sistema WSP Racing",
            quantity: 1,
            value: Number(process.env.ASAAS_PLAN_VALUE || 50),
          },
        ],
        customerData: {
          name: user.workspace.workshopName,
          email: user.workspace.email,
          cpfCnpj: user.workspace.document,
          phone: user.workspace.phone,
        },
        subscription: {
          cycle: "MONTHLY",
          nextDueDate: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
          endDate: format(addDays(new Date(), 3650), "yyyy-MM-dd HH:mm:ss"),
        },
      }),
    });

    return NextResponse.json({ checkoutUrl: checkout.link || checkout.url, checkoutId: checkout.id });
  } catch (error) {
    const { message, status } = apiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
