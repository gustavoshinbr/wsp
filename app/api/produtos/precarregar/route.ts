import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { ensureDefaultStockProducts } from "@/lib/default-stock-products";
import { apiError } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const user = await requireApiUser();
    await ensureDefaultStockProducts(user.workspaceId);
    return NextResponse.redirect(new URL("/estoque", req.url), { status: 303 });
  } catch (error) {
    const { message } = apiError(error);
    const url = new URL("/estoque", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url, { status: 303 });
  }
}
