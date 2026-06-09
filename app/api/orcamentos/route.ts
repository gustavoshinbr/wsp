import { NextResponse } from "next/server";
import { requireApiUser, requireManager } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError } from "@/lib/validations";
import { formNumber, formString, positiveInteger } from "@/lib/utils";

function values(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => String(value || "").trim());
}

function numberValue(value: string | undefined) {
  const parsed = Number(String(value || "0").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

type QuoteItemInput = {
  productId?: string;
  serviceId?: string;
  type: "PRODUCT" | "SERVICE" | "MANUAL";
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type QuickProductItemInput = QuoteItemInput & {
  buyPrice: number;
};

export async function GET() {
  try {
    const user = await requireApiUser();
    const quotes = await prisma.quote.findMany({
      where: { workspaceId: user.workspaceId },
      include: { client: true, motorcycle: true, items: { include: { product: true, service: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(quotes);
  } catch (error) {
    const { message, status } = apiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireApiUser();
    const formData = await req.formData();
    const clientId = formString(formData, "clientId");
    const motorcycleId = formString(formData, "motorcycleId") || null;
    if (!clientId) throw new ApiError("Selecione um cliente.");

    const client = await prisma.client.findFirst({ where: { id: clientId, workspaceId: user.workspaceId } });
    if (!client) throw new ApiError("Cliente inválido.", 404);
    if (motorcycleId) {
      const motorcycle = await prisma.motorcycle.findFirst({
        where: { id: motorcycleId, workspaceId: user.workspaceId, clientId },
      });
      if (!motorcycle) throw new ApiError("Moto inválida.", 404);
    }

    const items: QuoteItemInput[] = [];
    const quickProductItems: QuickProductItemInput[] = [];

    const productIds = values(formData, "productId");
    const productQuantities = values(formData, "productQuantity");
    for (let index = 0; index < productIds.length; index += 1) {
      const productId = productIds[index];
      if (!productId) continue;
      const product = await prisma.product.findFirst({ where: { id: productId, workspaceId: user.workspaceId } });
      if (!product) throw new ApiError("Produto inválido.", 404);
      const quantity = positiveInteger(productQuantities[index]);
      if (!quantity) throw new ApiError(`Quantidade inválida para ${product.name}.`);
      const unitPrice = Number(product.sellPrice);
      items.push({
        productId,
        type: "PRODUCT",
        description: product.name,
        quantity,
        unitPrice,
        total: quantity * unitPrice,
      });
    }

    const serviceIds = values(formData, "serviceId");
    const serviceQuantities = values(formData, "serviceQuantity");
    for (let index = 0; index < serviceIds.length; index += 1) {
      const serviceId = serviceIds[index];
      if (!serviceId) continue;
      const service = await prisma.service.findFirst({ where: { id: serviceId, workspaceId: user.workspaceId } });
      if (!service) throw new ApiError("Serviço inválido.", 404);
      const quantity = positiveInteger(serviceQuantities[index]);
      if (!quantity) throw new ApiError(`Quantidade inválida para ${service.name}.`);
      const unitPrice = Number(service.price);
      items.push({
        serviceId,
        type: "SERVICE",
        description: service.name,
        quantity,
        unitPrice,
        total: quantity * unitPrice,
      });
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

      const quantity = positiveInteger(quickProductQuantities[index]);
      if (!quantity) throw new ApiError(`Quantidade inválida para ${name}.`);
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
      const value = numberValue(laborValues[index]);
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
      items.push({
        type: "MANUAL",
        description: manualDescription,
        quantity: 1,
        unitPrice: manualValue,
        total: manualValue,
      });
    }

    if (quickProductItems.length || laborDescriptions.some(Boolean) || manualDescription || manualValue > 0) {
      requireManager(user.role);
    }
    if (!items.length && !quickProductItems.length) throw new ApiError("Adicione ao menos um item.");
    const total = [...items, ...quickProductItems].reduce((sum, item) => sum + item.total, 0);

    await prisma.$transaction(async (tx) => {
      const quoteItems: QuoteItemInput[] = [...items];
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

        quoteItems.push({
          productId: product.id,
          type: "PRODUCT",
          description: quickProduct.description,
          quantity: quickProduct.quantity,
          unitPrice: quickProduct.unitPrice,
          total: quickProduct.total,
        });
      }

      await tx.quote.create({
        data: {
          workspaceId: user.workspaceId,
          clientId,
          motorcycleId,
          manualValue: manualValue > 0 ? manualValue : null,
          total,
          notes: formString(formData, "notes") || null,
          status: "DRAFT",
          items: { create: quoteItems },
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
