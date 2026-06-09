import { NextResponse } from "next/server";
import { requireApiUser, requireManager } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrementStock } from "@/lib/stock";
import { apiError, ApiError } from "@/lib/validations";
import { formString, positiveInteger } from "@/lib/utils";

function values(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => String(value || "").trim());
}

function money(value: string | undefined) {
  const parsed = Number(String(value || "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : -1;
}

async function getSale(id: string, workspaceId: string) {
  const sale = await prisma.sale.findFirst({
    where: { id, workspaceId },
    include: {
      items: true,
      fiscalDocuments: { select: { status: true } },
    },
  });
  if (!sale) throw new ApiError("Venda não encontrada.", 404);
  if (sale.fiscalDocuments.some((document) => document.status === "AUTHORIZED" || document.status === "PROCESSING")) {
    throw new ApiError("Cancele ou conclua o documento fiscal antes de alterar esta venda.", 409);
  }
  return sale;
}

async function validateRelations(
  workspaceId: string,
  input: { clientId: string | null; motorcycleId: string | null; mechanicId: string | null },
) {
  if (input.clientId) {
    const client = await prisma.client.findFirst({ where: { id: input.clientId, workspaceId }, select: { id: true } });
    if (!client) throw new ApiError("Cliente inválido.", 404);
  }

  if (input.motorcycleId) {
    const motorcycle = await prisma.motorcycle.findFirst({
      where: {
        id: input.motorcycleId,
        workspaceId,
        ...(input.clientId ? { clientId: input.clientId } : {}),
      },
      select: { id: true },
    });
    if (!motorcycle) throw new ApiError("Moto inválida para o cliente selecionado.", 404);
  }

  if (input.mechanicId) {
    const mechanic = await prisma.user.findFirst({
      where: { id: input.mechanicId, workspaceId, isActive: true, isMechanic: true },
      select: { id: true },
    });
    if (!mechanic) throw new ApiError("Mecânico inválido.", 404);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireApiUser();
    requireManager(user.role);
    const sale = await getSale(id, user.workspaceId);
    const formData = await req.formData();
    const method = formString(formData, "_method").toLowerCase();

    if (method === "delete") {
      await prisma.$transaction(async (tx) => {
        for (const item of sale.items) {
          if (!item.productId) continue;
          await tx.product.updateMany({
            where: { id: item.productId, workspaceId: user.workspaceId },
            data: { quantity: { increment: item.quantity } },
          });
        }
        if (sale.quoteId) {
          await tx.quote.updateMany({
            where: { id: sale.quoteId, workspaceId: user.workspaceId, status: "PAID" },
            data: { status: "APPROVED" },
          });
        }
        if (sale.appointmentId) {
          await tx.appointment.updateMany({
            where: { id: sale.appointmentId, workspaceId: user.workspaceId, status: "FINISHED" },
            data: { status: "SCHEDULED" },
          });
        }
        await tx.sale.delete({ where: { id: sale.id } });
      });
    } else {
      const clientId = formString(formData, "clientId") || null;
      const motorcycleId = formString(formData, "motorcycleId") || null;
      const mechanicId = formString(formData, "mechanicId") || null;
      const paymentMethod = formString(formData, "paymentMethod") || null;
      await validateRelations(user.workspaceId, { clientId, motorcycleId, mechanicId });
      if (paymentMethod === "A prazo" && !clientId) {
        throw new ApiError("Venda a prazo precisa ter cliente vinculado.");
      }

      const itemIds = values(formData, "itemId");
      const descriptions = values(formData, "itemDescription");
      const quantities = values(formData, "itemQuantity");
      const unitPrices = values(formData, "itemUnitPrice");
      if (itemIds.length !== sale.items.length || new Set(itemIds).size !== sale.items.length) {
        throw new ApiError("A lista de itens da venda foi alterada de forma inválida.");
      }

      const existingItems = new Map(sale.items.map((item) => [item.id, item]));
      const [catalogProducts, catalogServices] = await Promise.all([
        prisma.product.findMany({
          where: {
            workspaceId: user.workspaceId,
            id: { in: sale.items.flatMap((item) => item.productId ? [item.productId] : []) },
          },
          select: { id: true, name: true, sellPrice: true },
        }),
        prisma.service.findMany({
          where: {
            workspaceId: user.workspaceId,
            id: { in: sale.items.flatMap((item) => item.serviceId ? [item.serviceId] : []) },
          },
          select: { id: true, name: true, price: true },
        }),
      ]);
      const productsById = new Map(catalogProducts.map((product) => [product.id, product]));
      const servicesById = new Map(catalogServices.map((service) => [service.id, service]));
      const items = itemIds.map((itemId, index) => {
        const current = existingItems.get(itemId);
        if (!current) throw new ApiError("Item da venda inválido.");
        const quantity = positiveInteger(quantities[index]);
        const product = current.productId ? productsById.get(current.productId) : null;
        const service = current.serviceId ? servicesById.get(current.serviceId) : null;
        if (current.productId && !product) throw new ApiError("Produto da venda não pertence a esta oficina.", 404);
        if (current.serviceId && !service) throw new ApiError("Serviço da venda não pertence a esta oficina.", 404);

        const description = (product?.name || service?.name || descriptions[index])?.slice(0, 240);
        const unitPrice = product
          ? Number(product.sellPrice)
          : service
            ? Number(service.price)
            : money(unitPrices[index]);
        if (!description || !quantity || unitPrice < 0 || unitPrice > 100_000_000) {
          throw new ApiError("Descrição, quantidade ou valor de item inválido.");
        }
        return {
          productId: current.productId,
          serviceId: current.serviceId,
          type: current.type,
          description,
          quantity,
          unitPrice,
          total: quantity * unitPrice,
        };
      });

      const total = items.reduce((sum, item) => sum + item.total, 0);
      const dueDateValue = formString(formData, "dueDate");
      const dueDate = dueDateValue ? new Date(`${dueDateValue}T12:00:00`) : null;
      if (dueDate && Number.isNaN(dueDate.getTime())) throw new ApiError("Data de vencimento inválida.");
      const isCredit = paymentMethod === "A prazo";
      const nextPaymentStatus = isCredit
        ? sale.paymentStatus === "CREDIT_PAID" ? "CREDIT_PAID" : "CREDIT_OPEN"
        : "PAID";

      await prisma.$transaction(async (tx) => {
        for (const item of sale.items) {
          if (!item.productId) continue;
          await tx.product.updateMany({
            where: { id: item.productId, workspaceId: user.workspaceId },
            data: { quantity: { increment: item.quantity } },
          });
        }

        await tx.saleItem.deleteMany({ where: { saleId: sale.id } });
        await tx.sale.update({
          where: { id: sale.id },
          data: {
            clientId,
            motorcycleId,
            mechanicId,
            paymentMethod,
            dueDate: isCredit ? dueDate : null,
            paymentStatus: nextPaymentStatus,
            paidAt: nextPaymentStatus === "CREDIT_OPEN" ? null : sale.paidAt || new Date(),
            total,
            items: { create: items },
          },
        });
        await decrementStock(tx, user.workspaceId, items);
      });
    }

    return NextResponse.redirect(new URL("/vendas", req.url), { status: 303 });
  } catch (error) {
    const { message } = apiError(error);
    const url = new URL("/vendas", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url, { status: 303 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireApiUser();
    requireManager(user.role);
    const sale = await getSale(id, user.workspaceId);

    await prisma.$transaction(async (tx) => {
      for (const item of sale.items) {
        if (!item.productId) continue;
        await tx.product.updateMany({
          where: { id: item.productId, workspaceId: user.workspaceId },
          data: { quantity: { increment: item.quantity } },
        });
      }
      if (sale.quoteId) {
        await tx.quote.updateMany({
          where: { id: sale.quoteId, workspaceId: user.workspaceId, status: "PAID" },
          data: { status: "APPROVED" },
        });
      }
      if (sale.appointmentId) {
        await tx.appointment.updateMany({
          where: { id: sale.appointmentId, workspaceId: user.workspaceId, status: "FINISHED" },
          data: { status: "SCHEDULED" },
        });
      }
      await tx.sale.delete({ where: { id: sale.id } });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const { message, status } = apiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
