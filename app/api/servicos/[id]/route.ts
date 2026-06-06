import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError } from "@/lib/validations";
import { formNumber, formString } from "@/lib/utils";

async function ensureService(id: string, workspaceId: string) {
  const service = await prisma.service.findFirst({ where: { id, workspaceId } });
  if (!service) throw new ApiError("Serviço não encontrado.", 404);
  return service;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireApiUser();
    await ensureService(id, user.workspaceId);
    const formData = await req.formData();
    const method = formString(formData, "_method").toLowerCase();

    if (method === "delete") {
      await prisma.service.delete({ where: { id } });
    } else {
      const name = formString(formData, "name");
      const price = formNumber(formData, "price");
      if (!name) throw new ApiError("Nome do serviço é obrigatório.");
      if (price < 0) throw new ApiError("O valor do serviço não pode ser negativo.");

      await prisma.service.update({
        where: { id },
        data: {
          name,
          price,
          description: formString(formData, "description") || null,
        },
      });
    }

    return NextResponse.redirect(new URL("/servicos", req.url));
  } catch (error) {
    const { message } = apiError(error);
    const url = new URL("/servicos", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireApiUser();
    await ensureService(id, user.workspaceId);
    await prisma.service.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { message, status } = apiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
