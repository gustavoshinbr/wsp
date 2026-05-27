import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError } from "@/lib/validations";
import { formString } from "@/lib/utils";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireApiUser();
    const formData = await req.formData().catch(() => new FormData());
    const paymentMethod = formString(formData, "paymentMethod") || "A vista";

    const quote = await prisma.quote.findFirst({
      where: { id: params.id, workspaceId: user.workspaceId },
      include: { items: true },
    });
    if (!quote) throw new ApiError("Orcamento nao encontrado.", 404);
    if (quote.status === "PAID") throw new ApiError("Orcamento ja finalizado.");
    if (quote.status !== "APPROVED") throw new ApiError("Aprove o orcamento antes de finalizar.");

    await prisma.$transaction(async (tx) => {
      const existingSale = await tx.sale.findFirst({
        where: { workspaceId: user.workspaceId, quoteId: quote.id },
      });
      if (existingSale) throw new ApiError("Orcamento ja gerou uma venda.");

      for (const item of quote.items) {
        if (!item.productId) continue;
        const product = await tx.product.findFirst({
          where: { id: item.productId, workspaceId: user.workspaceId },
        });
        if (!product || product.quantity < item.quantity) {
          throw new ApiError(`Estoque insuficiente para ${item.description}.`);
        }
      }

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

      for (const item of quote.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { quantity: { decrement: item.quantity } },
          });
        }
      }

      await tx.quote.update({
        where: { id: quote.id },
        data: { status: "PAID" },
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
