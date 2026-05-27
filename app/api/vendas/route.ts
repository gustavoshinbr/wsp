import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError } from "@/lib/validations";
import { formNumber, formString } from "@/lib/utils";

function values(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => String(value || "").trim());
}

type SaleItemInput = {
  productId?: string;
  serviceId?: string;
  type: "PRODUCT" | "SERVICE" | "MANUAL";
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type QuickProductItemInput = SaleItemInput & {
  buyPrice: number;
};

function numberValue(value: string | undefined) {
  const parsed = Number(String(value || "0").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET() {
  try {
    const user = await requireApiUser();
    const sales = await prisma.sale.findMany({
      where: { workspaceId: user.workspaceId },
      include: { client: true, motorcycle: true, mechanic: true, items: { include: { product: true, service: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(sales);
  } catch (error) {
    const { message, status } = apiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireApiUser();
    const formData = await req.formData();
    const clientId = formString(formData, "clientId") || null;
    const motorcycleId = formString(formData, "motorcycleId") || null;
    const mechanicId = formString(formData, "mechanicId") || null;
    const paymentMethod = formString(formData, "paymentMethod") || null;
    const isCreditSale = paymentMethod === "A prazo";

    if (clientId) {
      const client = await prisma.client.findFirst({ where: { id: clientId, workspaceId: user.workspaceId } });
      if (!client) throw new ApiError("Cliente inválido.", 404);
    }
    if (isCreditSale && !clientId) throw new ApiError("Venda a prazo precisa ter cliente vinculado.");

    if (motorcycleId) {
      const motorcycle = await prisma.motorcycle.findFirst({ where: { id: motorcycleId, workspaceId: user.workspaceId } });
      if (!motorcycle) throw new ApiError("Moto inválida.", 404);
    }

    if (mechanicId) {
      const mechanic = await prisma.user.findFirst({
        where: { id: mechanicId, workspaceId: user.workspaceId, isActive: true, isMechanic: true },
      });
      if (!mechanic) throw new ApiError("Mecânico responsável inválido.", 404);
    }

    const items: SaleItemInput[] = [];
    const quickProductItems: QuickProductItemInput[] = [];

    const productIds = values(formData, "productId");
    const productQuantities = values(formData, "productQuantity");
    for (let index = 0; index < productIds.length; index += 1) {
      const productId = productIds[index];
      if (!productId) continue;
      const product = await prisma.product.findFirst({ where: { id: productId, workspaceId: user.workspaceId } });
      if (!product) throw new ApiError("Produto inválido.", 404);
      const quantity = Math.max(1, Number(productQuantities[index]) || 1);
      if (product.quantity < quantity) throw new ApiError(`Estoque insuficiente para ${product.name}.`);
      const unitPrice = Number(product.sellPrice);
      items.push({ productId, type: "PRODUCT", description: product.name, quantity, unitPrice, total: quantity * unitPrice });
    }

    const serviceIds = values(formData, "serviceId");
    const serviceQuantities = values(formData, "serviceQuantity");
    for (let index = 0; index < serviceIds.length; index += 1) {
      const serviceId = serviceIds[index];
      if (!serviceId) continue;
      const service = await prisma.service.findFirst({ where: { id: serviceId, workspaceId: user.workspaceId } });
      if (!service) throw new ApiError("Serviço inválido.", 404);
      const quantity = Math.max(1, Number(serviceQuantities[index]) || 1);
      const unitPrice = Number(service.price);
      items.push({ serviceId, type: "SERVICE", description: service.name, quantity, unitPrice, total: quantity * unitPrice });
    }

    const quickProductNames = values(formData, "quickProductName");
    const quickProductQuantities = values(formData, "quickProductQuantity");
    const quickProductUnitPrices = values(formData, "quickProductUnitPrice");
    const quickProductBuyPrices = values(formData, "quickProductBuyPrice");
    for (let index = 0; index < quickProductNames.length; index += 1) {
      const name = quickProductNames[index];
      const unitPrice = numberValue(quickProductUnitPrices[index]);
      if (!name && unitPrice <= 0) continue;
      if (!name || unitPrice <= 0) throw new ApiError("Produto criado na hora precisa ter nome e valor de venda.");

      const quantity = Math.max(1, Number(quickProductQuantities[index]) || 1);
      quickProductItems.push({
        type: "PRODUCT",
        description: name,
        quantity,
        unitPrice,
        buyPrice: Math.max(0, numberValue(quickProductBuyPrices[index])),
        total: quantity * unitPrice,
      });
    }

    const laborDescriptions = values(formData, "laborDescription");
    const laborValues = values(formData, "laborValue");
    for (let index = 0; index < laborDescriptions.length; index += 1) {
      const description = laborDescriptions[index];
      const value = Number(String(laborValues[index] || "0").replace(",", "."));
      if (description && value > 0) {
        items.push({
          type: "SERVICE",
          description: `Mão de obra: ${description}`,
          quantity: 1,
          unitPrice: value,
          total: value,
        });
      }
    }

    const manualDescription = formString(formData, "manualDescription");
    const manualValue = formNumber(formData, "manualValue");
    if (manualDescription && manualValue > 0) {
      items.push({ type: "MANUAL", description: manualDescription, quantity: 1, unitPrice: manualValue, total: manualValue });
    }

    if (!items.length && !quickProductItems.length) throw new ApiError("Adicione ao menos um item.");
    const total = [...items, ...quickProductItems].reduce((sum, item) => sum + item.total, 0);

    await prisma.$transaction(async (tx) => {
      const saleItems: SaleItemInput[] = [...items];
      for (const quickProduct of quickProductItems) {
        const product = await tx.product.create({
          data: {
            workspaceId: user.workspaceId,
            name: quickProduct.description,
            buyPrice: quickProduct.buyPrice,
            sellPrice: quickProduct.unitPrice,
            quantity: quickProduct.quantity,
          },
        });

        saleItems.push({
          productId: product.id,
          type: "PRODUCT",
          description: quickProduct.description,
          quantity: quickProduct.quantity,
          unitPrice: quickProduct.unitPrice,
          total: quickProduct.total,
        });
      }

      const sale = await tx.sale.create({
        data: {
          workspaceId: user.workspaceId,
          clientId,
          motorcycleId,
          mechanicId,
          total,
          paymentMethod,
          paymentStatus: isCreditSale ? "CREDIT_OPEN" : "PAID",
          paidAt: isCreditSale ? null : new Date(),
          dueDate: isCreditSale && formString(formData, "dueDate") ? new Date(formString(formData, "dueDate")) : null,
          items: { create: saleItems },
        },
      });

      for (const item of saleItems) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { quantity: { decrement: item.quantity } },
          });
        }
      }

      return sale;
    });

    return NextResponse.redirect(new URL("/vendas", req.url));
  } catch (error) {
    const { message } = apiError(error);
    const url = new URL("/vendas", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
  }
}
