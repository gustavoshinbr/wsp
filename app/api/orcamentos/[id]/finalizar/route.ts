import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrementStock } from "@/lib/stock";
import { apiError, ApiError } from "@/lib/validations";
import { formString } from "@/lib/utils";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireApiUser();
    const formData = await req.formData().catch(() => new FormData());
    const paymentMethod = formString(formData, "paymentMethod") || "À vista";

    const quote = await prisma.quote.findFirst({
      where: { id, workspaceId: user.workspaceId },
      include: { items: true },
    });
    if (!quote) throw new ApiError("Orçamento não encontrado.", 404);
    if (quote.status === "PAID") throw new ApiError("Orçamento já finalizado.");
    if (quote.status === "CANCELLED") throw new ApiError("Orçamento cancelado não pode ser finalizado.");

    await prisma.$transaction(async (tx) => {
      const locked = await tx.quote.updateMany({
        where: {
          id: quote.id,
          workspaceId: user.workspaceId,
          status: { in: ["DRAFT", "SENT", "APPROVED"] },
        },
        data: { status: "PAID" },
      });
      if (locked.count !== 1) throw new ApiError("Orçamento já finalizado ou cancelado.");

      const existingSale = await tx.sale.findFirst({
        where: { workspaceId: user.workspaceId, quoteId: quote.id },
      });
      if (existingSale) throw new ApiError("Orçamento já gerou uma venda.");

      await decrementStock(tx, user.workspaceId, quote.items);

      await tx.sale.create({
        data: {
          workspaceId: user.workspaceId,
          clientId: quote.clientId,
          motorcycleId: quote.motorcycleId,
          quoteId: quote.id,
          total: Number(quote.total),
          paymentMethod,
          paymentStatus: "PAID",
          paidAt: new Date(),
          items: {
            create: quote.items.map((item) => ({
              productId: item.productId,
              serviceId: item.serviceId,
              type: item.type,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
            })),
          },
        },
      });

    });

    return NextResponse.redirect(new URL("/orcamentos", req.url), { status: 303 });
  } catch (error) {
    const { message } = apiError(error);
    const url = new URL("/orcamentos", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url, { status: 303 });
  }
}
