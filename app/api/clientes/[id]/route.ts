import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError } from "@/lib/validations";
import { formString, normalizeDocument } from "@/lib/utils";

async function ensureClient(id: string, workspaceId: string) {
  const client = await prisma.client.findFirst({ where: { id, workspaceId } });
  if (!client) throw new ApiError("Cliente não encontrado.", 404);
  return client;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireApiUser();
    const client = await prisma.client.findFirst({
      where: { id, workspaceId: user.workspaceId },
      include: { motorcycles: true },
    });
    if (!client) throw new ApiError("Cliente não encontrado.", 404);
    return NextResponse.json(client);
  } catch (error) {
    const { message, status } = apiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireApiUser();
    await ensureClient(id, user.workspaceId);
    const formData = await req.formData();
    const method = formString(formData, "_method").toLowerCase();

    if (method === "delete") {
      await prisma.client.delete({ where: { id } });
    } else {
      const name = formString(formData, "name");
      const phone = formString(formData, "phone");
      if (!name || !phone) throw new ApiError("Nome e telefone são obrigatórios.");

      await prisma.client.update({
        where: { id },
        data: {
          name,
          phone,
          document: normalizeDocument(formString(formData, "document")) || null,
          email: formString(formData, "email").toLowerCase() || null,
          address: formString(formData, "address") || null,
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

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireApiUser();
    await ensureClient(id, user.workspaceId);
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { message, status } = apiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
