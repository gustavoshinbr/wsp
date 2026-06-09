import { NextResponse } from "next/server";
import { requireApiUser, requireManager } from "@/lib/auth";
import { apiError } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const user = await requireApiUser({ allowExpiredSubscription: true });
    requireManager(user.role);

    const url = new URL("/assinatura", req.url);
    url.searchParams.set("error", "O status é atualizado automaticamente pelo webhook do Asaas.");
    return NextResponse.redirect(url, { status: 303 });
  } catch (error) {
    const { message } = apiError(error);
    const url = new URL("/assinatura", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url, { status: 303 });
  }
}
