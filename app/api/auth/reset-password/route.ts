import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { resetNeonPassword } from "@/lib/neon-auth-sync";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, requestIp } from "@/lib/rate-limit";
import { formString } from "@/lib/utils";
import { validatePassword } from "@/lib/validations";

function redirectError(req: Request, token: string, state: string, message: string) {
  const url = new URL("/reset-password", req.url);
  if (token) url.searchParams.set("token", token);
  if (state) url.searchParams.set("state", state);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(req: Request) {
  const limit = consumeRateLimit(`reset-password:${requestIp(req.headers)}`, {
    limit: 8,
    windowMs: 30 * 60_000,
  });
  const formData = await req.formData();
  const token = formString(formData, "token");
  const state = formString(formData, "state");
  const password = formString(formData, "password");
  const confirmPassword = formString(formData, "confirmPassword");
  if (!limit.allowed) return redirectError(req, token, state, "Muitas tentativas. Aguarde alguns minutos.");
  if (!token || !state) return redirectError(req, "", "", "Link de recuperação inválido.");
  if (!validatePassword(password)) return redirectError(req, token, state, "A senha precisa ter no mínimo 8 caracteres.");
  if (password !== confirmPassword) return redirectError(req, token, state, "As senhas não conferem.");

  const resetState = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash: createHash("sha256").update(state).digest("hex"),
      usedAt: null,
      expiresAt: { gt: new Date() },
      user: { isActive: true },
    },
    select: { id: true, userId: true },
  });
  if (!resetState) return redirectError(req, "", "", "Este link expirou ou já foi utilizado.");

  try {
    await resetNeonPassword(token, password);
  } catch (error) {
    console.error("Falha ao redefinir senha no Neon Auth", error);
    return redirectError(req, "", "", "Este link expirou ou já foi utilizado.");
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetState.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetState.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.redirect(new URL("/login?reset=1", req.url), { status: 303 });
}
