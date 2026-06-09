import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { ensureNeonAuthUser, requestNeonPasswordReset } from "@/lib/neon-auth-sync";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, requestIp } from "@/lib/rate-limit";
import { formString } from "@/lib/utils";
import { isValidEmail } from "@/lib/validations";

function redirectResult(req: Request) {
  const url = new URL("/forgot-password", req.url);
  url.searchParams.set("sent", "1");
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const email = formString(formData, "email").toLowerCase();
  const limit = consumeRateLimit(`forgot-password:${requestIp(req.headers)}:${email}`, {
    limit: 4,
    windowMs: 30 * 60_000,
  });
  if (!limit.allowed || !isValidEmail(email)) return redirectResult(req);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, isActive: true },
  });
  if (!user?.isActive) return redirectResult(req);

  let resetStateId: string | null = null;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    await ensureNeonAuthUser(user);
    const state = randomBytes(32).toString("base64url");
    const resetState = await prisma.passwordResetToken.create({
      data: {
        tokenHash: createHash("sha256").update(state).digest("hex"),
        userId: user.id,
        expiresAt: new Date(Date.now() + 15 * 60_000),
      },
      select: { id: true },
    });
    resetStateId = resetState.id;
    const redirectUrl = new URL("/reset-password", baseUrl);
    redirectUrl.searchParams.set("state", state);
    await requestNeonPasswordReset(user.email, redirectUrl.toString());
  } catch (error) {
    if (resetStateId) {
      await prisma.passwordResetToken.delete({ where: { id: resetStateId } }).catch(() => null);
    }
    console.error("Falha no envio de recuperação de senha pelo Neon Auth", error);
  }

  return redirectResult(req);
}
