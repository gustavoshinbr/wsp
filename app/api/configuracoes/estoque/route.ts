import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError } from "@/lib/validations";
import { formString } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const user = await requireApiUser({ allowExpiredSubscription: true });
    const formData = await req.formData();
    const stockViewMode = formString(formData, "stockViewMode");

    if (stockViewMode !== "simples" && stockViewMode !== "completo") {
      throw new ApiError("Modo de estoque invalido.");
    }

    await prisma.workspace.update({
      where: { id: user.workspaceId },
      data: { stockViewMode },
    });

    const url = new URL("/configuracoes", req.url);
    url.searchParams.set("success", "stock-view");
    return NextResponse.redirect(url, { status: 303 });
  } catch (error) {
    const { message } = apiError(error);
    const url = new URL("/configuracoes", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url, { status: 303 });
  }
}
