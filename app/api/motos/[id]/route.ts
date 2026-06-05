import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError } from "@/lib/validations";
import { formString } from "@/lib/utils";

async function ensureMotorcycle(id: string, workspaceId: string) {
  const motorcycle = await prisma.motorcycle.findFirst({ where: { id, workspaceId } });
  if (!motorcycle) throw new ApiError("Moto não encontrada.", 404);
  return motorcycle;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireApiUser();
    await ensureMotorcycle(id, user.workspaceId);
    const formData = await req.formData();
    const method = formString(formData, "_method").toLowerCase();

    if (method === "delete") {
      await prisma.motorcycle.delete({ where: { id } });
    } else {
      await prisma.motorcycle.update({
        where: { id },
        data: {
          plate: formString(formData, "plate").toUpperCase(),
          model: formString(formData, "model") || null,
          brand: formString(formData, "brand") || null,
          year: formString(formData, "year") || null,
          color: formString(formData, "color") || null,
        },
      });
    }

    return NextResponse.redirect(new URL("/clientes", req.url));
  } catch (error) {
    const { message } = apiError(error);
    const url = new URL("/clientes", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireApiUser();
    await ensureMotorcycle(id, user.workspaceId);
    await prisma.motorcycle.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { message, status } = apiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
