import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";
import { verifyPassword } from "@/lib/auth";
import { neonAuth } from "@/lib/neon-auth-server";
import { ensureNeonAuthUser } from "@/lib/neon-auth-sync";
import { formString } from "@/lib/utils";
import { clearRateLimit, consumeRateLimit, requestIp } from "@/lib/rate-limit";

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
  const ip = requestIp(req.headers);
  const ipKey = `login:ip:${ip}`;
  const accountKey = `login:account:${email || "empty"}:${ip}`;
  const ipLimit = consumeRateLimit(ipKey, { limit: 30, windowMs: 15 * 60_000 });
  const accountLimit = consumeRateLimit(accountKey, { limit: 8, windowMs: 15 * 60_000 });
  if (!ipLimit.allowed || !accountLimit.allowed) {
    return redirectWithError(req, "Muitas tentativas. Aguarde alguns minutos e tente novamente.");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { workspace: true },
  });

  if (!user || !user.isActive) {
    return redirectWithError(req, "Email ou senha inválidos.");
  }

  if (user.authProvider === "NEON" && user.externalAuthId) {
    const result = await neonAuth.signIn.email({ email, password, rememberMe: remember });
    if (result.error && !(await verifyPassword(password, user.passwordHash))) {
      return redirectWithError(req, "Email ou senha inválidos.");
    }
  } else {
    if (!(await verifyPassword(password, user.passwordHash))) {
      return redirectWithError(req, "Email ou senha inválidos.");
    }
    try {
      await ensureNeonAuthUser(user, password);
      const result = await neonAuth.signIn.email({ email, password, rememberMe: remember });
      if (result.error) {
        await prisma.user.update({
          where: { id: user.id },
          data: { authProvider: "LOCAL", externalAuthId: null },
        });
        console.error("Neon Auth não iniciou a sessão após sincronizar", result.error);
      }
    } catch (error) {
      console.error("Falha ao sincronizar login com Neon Auth", error);
    }
  }
  clearRateLimit(accountKey);

  await setSessionCookie({
    userId: user.id,
    workspaceId: user.workspaceId,
    email: user.email,
    remember,
    subscriptionStatus: user.workspace.subscriptionStatus,
    trialEndsAt: user.workspace.trialEndsAt,
  });

  const requestedPath = formString(formData, "next");
  const destination = requestedPath.startsWith("/") && !requestedPath.startsWith("//")
    ? requestedPath
    : "/dashboard";
  return NextResponse.redirect(new URL(destination, req.url));
}
