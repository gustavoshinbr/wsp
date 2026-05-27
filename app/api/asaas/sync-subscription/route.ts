import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { syncWorkspaceSubscription } from "@/lib/subscription-sync";
import { apiError } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const user = await requireApiUser({ allowExpiredSubscription: true });
    await syncWorkspaceSubscription(user.workspaceId);

    const url = new URL("/assinatura", req.url);
    url.searchParams.set("synced", "1");
    return NextResponse.redirect(url, { status: 303 });
  } catch (error) {
    const { message } = apiError(error);
    const url = new URL("/assinatura", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url, { status: 303 });
  }
}
