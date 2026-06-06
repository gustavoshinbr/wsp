import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError } from "@/lib/validations";
import { formString } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await requireApiUser();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    const clients = await prisma.client.findMany({
      where: {
        workspaceId: user.workspaceId,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { phone: { contains: q } },
                { motorcycles: { some: { plate: { contains: q, mode: "insensitive" } } } },
              ],
            }
          : {}),
      },
      include: { motorcycles: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(clients);
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

    if (clientId) {
      if (!plate) throw new ApiError("Informe a placa da moto.");
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
    } else {
      const name = formString(formData, "name");
      const phone = formString(formData, "phone");
      if (!name || !phone) throw new ApiError("Nome e telefone são obrigatórios.");
      if (plate) {
        const existingMotorcycle = await prisma.motorcycle.findFirst({
          where: { workspaceId: user.workspaceId, plate: { equals: plate, mode: "insensitive" } },
          select: { id: true },
        });
        if (existingMotorcycle) throw new ApiError("Já existe uma moto cadastrada com esta placa.");
      }

      await prisma.client.create({
        data: {
          workspaceId: user.workspaceId,
          name,
          phone,
          address: formString(formData, "address") || null,
          motorcycles: plate
            ? {
                create: {
                  workspaceId: user.workspaceId,
                  plate,
                  model: formString(formData, "model") || null,
                  brand: formString(formData, "brand") || null,
                  year: formString(formData, "year") || null,
                  color: formString(formData, "color") || null,
                },
              }
            : undefined,
        },
      });
    }

    return NextResponse.redirect(new URL("/clientes", req.url), { status: 303 });
  } catch (error) {
    const { message } = apiError(error);
    const url = new URL("/clientes", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url, { status: 303 });
  }
}
