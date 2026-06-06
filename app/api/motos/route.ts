import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError } from "@/lib/validations";
import { formString } from "@/lib/utils";

export async function GET() {
  try {
    const user = await requireApiUser();
    const motorcycles = await prisma.motorcycle.findMany({
      where: { workspaceId: user.workspaceId },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(motorcycles);
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
    const plate = formString(formData, "plate").toUpperCase();
    if (!clientId || !plate) throw new ApiError("Cliente e placa são obrigatórios.");

    const client = await prisma.client.findFirst({ where: { id: clientId, workspaceId: user.workspaceId } });
    if (!client) throw new ApiError("Cliente não encontrado.", 404);
    const existingMotorcycle = await prisma.motorcycle.findFirst({
      where: { workspaceId: user.workspaceId, plate: { equals: plate, mode: "insensitive" } },
      select: { id: true },
    });
    if (existingMotorcycle) throw new ApiError("Já existe uma moto cadastrada com esta placa.");

    await prisma.motorcycle.create({
      data: {
        workspaceId: user.workspaceId,
        clientId,
        plate,
        model: formString(formData, "model") || null,
        brand: formString(formData, "brand") || null,
        year: formString(formData, "year") || null,
        color: formString(formData, "color") || null,
      },
    });

    return NextResponse.redirect(new URL("/clientes", req.url));
  } catch (error) {
    const { message } = apiError(error);
    const url = new URL("/clientes", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
  }
}
