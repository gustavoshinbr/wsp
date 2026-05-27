import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError } from "@/lib/validations";
import { formString } from "@/lib/utils";

async function ensureQuote(id: string, workspaceId: string) {
  const quote = await prisma.quote.findFirst({ where: { id, workspaceId } });
  if (!quote) throw new ApiError("Orçamento não encontrado.", 404);
  return quote;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireApiUser();
    const quote = await prisma.quote.findFirst({
      where: { id: params.id, workspaceId: user.workspaceId },
      include: { client: true, motorcycle: true, items: { include: { product: true, service: true } } },
    });
    if (!quote) throw new ApiError("Orçamento não encontrado.", 404);
    return NextResponse.json(quote);
  } catch (error) {
    const { message, status } = apiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireApiUser();
    const quote = await ensureQuote(params.id, user.workspaceId);
    const formData = await req.formData();
    const method = formString(formData, "_method").toLowerCase();

    if (method === "delete") {
      if (quote.status === "APPROVED" || quote.status === "PAID") {
        throw new ApiError("Orçamento aprovado ou finalizado não pode ser excluído.");
      }
      await prisma.quote.delete({ where: { id: params.id } });
    } else {
      const status = formString(formData, "status") as "DRAFT" | "SENT" | "APPROVED" | "CANCELLED" | "PAID";
      await prisma.quote.update({
        where: { id: params.id },
        data: {
          status: status || "DRAFT",
          notes: formString(formData, "notes") || undefined,
        },
      });
    }

    return NextResponse.redirect(new URL("/orcamentos", req.url), { status: 303 });
  } catch (error) {
    const { message } = apiError(error);
    const url = new URL("/orcamentos", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url, { status: 303 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireApiUser();
    const quote = await ensureQuote(params.id, user.workspaceId);
    if (quote.status === "APPROVED" || quote.status === "PAID") {
      throw new ApiError("Orçamento aprovado ou finalizado não pode ser excluído.");
    }
    await prisma.quote.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { message, status } = apiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
