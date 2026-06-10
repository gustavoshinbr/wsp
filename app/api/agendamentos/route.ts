import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError } from "@/lib/validations";
import { formNumber, formString, positiveInteger } from "@/lib/utils";

function values(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => String(value || "").trim());
}

export async function GET() {
  try {
    const user = await requireApiUser();
    const appointments = await prisma.appointment.findMany({
      where: { workspaceId: user.workspaceId },
      include: { client: true, motorcycle: true, mechanic: true, items: { include: { product: true, service: true } } },
      orderBy: { date: "asc" },
    });
    return NextResponse.json(appointments);
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
    const mechanicId = formString(formData, "mechanicId") || null;
    const date = new Date(formString(formData, "date"));
    if (!clientId || Number.isNaN(date.getTime())) throw new ApiError("Cliente e data válida são obrigatórios.");

    const client = await prisma.client.findFirst({ where: { id: clientId, workspaceId: user.workspaceId } });
    if (!client) throw new ApiError("Cliente inválido.", 404);

    if (motorcycleId) {
      const motorcycle = await prisma.motorcycle.findFirst({
        where: { id: motorcycleId, workspaceId: user.workspaceId, clientId },
      });
      if (!motorcycle) throw new ApiError("Moto inválida.", 404);
    }

    if (mechanicId) {
      const mechanic = await prisma.user.findFirst({
        where: { id: mechanicId, workspaceId: user.workspaceId, isActive: true, isMechanic: true },
      });
      if (!mechanic) throw new ApiError("Mecânico responsável inválido.", 404);
    }

    const items: Array<{
      productId?: string;
      serviceId?: string;
      type: "PRODUCT" | "SERVICE" | "MANUAL";
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }> = [];

    const itemTypes = values(formData, "itemType");
    const itemIds = values(formData, "itemId");
    const itemQuantities = values(formData, "itemQuantity");

    for (let index = 0; index < itemTypes.length; index += 1) {
      const itemType = itemTypes[index] as "PRODUCT" | "SERVICE" | "MANUAL";
      const itemId = itemIds[index];
      if (!itemId) continue;
      const quantity = positiveInteger(itemQuantities[index]);
      if (!quantity) throw new ApiError("Quantidade inválida para item previsto.");

      if (itemType === "PRODUCT") {
        const product = await prisma.product.findFirst({ where: { id: itemId, workspaceId: user.workspaceId } });
        if (!product) throw new ApiError("Produto inválido.", 404);
        const unitPrice = Number(product.sellPrice);
        items.push({ productId: itemId, type: "PRODUCT", description: product.name, quantity, unitPrice, total: quantity * unitPrice });
      } else if (itemType === "SERVICE") {
        const service = await prisma.service.findFirst({ where: { id: itemId, workspaceId: user.workspaceId } });
        if (!service) throw new ApiError("Serviço inválido.", 404);
        const unitPrice = Number(service.price);
        items.push({ serviceId: itemId, type: "SERVICE", description: service.name, quantity, unitPrice, total: quantity * unitPrice });
      }
    }

    const laborDescription = formString(formData, "laborDescription");
    const laborValue = formNumber(formData, "laborValue");

    if (laborDescription && laborValue > 0) {
      items.push({
        type: "MANUAL",
        description: laborDescription,
        quantity: 1,
        unitPrice: laborValue,
        total: laborValue,
      });
    }

    const total = items.reduce((sum, item) => sum + item.total, 0);

    await prisma.appointment.create({
      data: {
        workspaceId: user.workspaceId,
        clientId,
        motorcycleId,
        mechanicId,
        date,
        notes: formString(formData, "notes") || null,
        total,
        items: items.length ? { create: items } : undefined,
      },
    });

    return NextResponse.redirect(new URL("/agendamentos", req.url));
  } catch (error) {
    const { message } = apiError(error);
    const url = new URL("/agendamentos", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
  }
}
