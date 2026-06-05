import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError } from "@/lib/validations";
import { formString } from "@/lib/utils";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireApiUser();
    const formData = await req.formData().catch(() => new FormData());
    const sale = await prisma.sale.findFirst({
      where: { id, workspaceId: user.workspaceId, paymentStatus: "CREDIT_OPEN" },
    });
    if (!sale) throw new ApiError("Venda a prazo em aberto não encontrada.", 404);

    await prisma.sale.update({
      where: { id: sale.id },
      data: {
        paymentStatus: "CREDIT_PAID",
        paidAt: new Date(),
        paymentMethod: formString(formData, "paymentMethod") || sale.paymentMethod || "Recebido",
      },
    });

    return NextResponse.redirect(new URL("/vendas-a-prazo", req.url));
  } catch (error) {
    const { message } = apiError(error);
    const url = new URL("/vendas-a-prazo", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
  }
}
