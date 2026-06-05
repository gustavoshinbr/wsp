import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";
import { verifyPassword } from "@/lib/auth";
import { formString } from "@/lib/utils";

function redirectWithError(req: Request, message: string) {
  const url = new URL("/login", req.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const email = formString(formData, "email").toLowerCase();
  const password = formString(formData, "password");
  const remember = formData.get("remember") === "on";

  const user = await prisma.user.findUnique({
    where: { email },
    include: { workspace: true },
  });

  if (!user || !user.isActive || !(await verifyPassword(password, user.passwordHash))) {
    return redirectWithError(req, "Email ou senha inválidos.");
  }

  await setSessionCookie({
    userId: user.id,
    workspaceId: user.workspaceId,
    email: user.email,
    remember,
    subscriptionStatus: user.workspace.subscriptionStatus,
    trialEndsAt: user.workspace.trialEndsAt,
  });

  return NextResponse.redirect(new URL("/dashboard", req.url));
}
