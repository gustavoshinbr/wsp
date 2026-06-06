import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError } from "@/lib/validations";
import { formNumber, formString } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await requireApiUser();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const services = await prisma.service.findMany({
      where: {
        workspaceId: user.workspaceId,
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(services);
  } catch (error) {
    const { message, status } = apiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireApiUser();
    const formData = await req.formData();
    const name = formString(formData, "name");
    if (!name) throw new ApiError("Nome do serviço é obrigatório.");
    const price = formNumber(formData, "price");
    if (price < 0) throw new ApiError("O valor do serviço não pode ser negativo.");

    await prisma.service.create({
      data: {
        workspaceId: user.workspaceId,
        name,
        price,
        description: formString(formData, "description") || null,
      },
    });

    return NextResponse.redirect(new URL("/servicos", req.url));
  } catch (error) {
    const { message } = apiError(error);
    const url = new URL("/servicos", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
  }
}
