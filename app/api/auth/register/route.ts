import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";
import { trialEndsAtFrom } from "@/lib/subscription";
import { formString, normalizeDocument, normalizePhone } from "@/lib/utils";
import { isValidEmail, validateCpfCnpj, validatePassword, validatePhone } from "@/lib/validations";
import { consumeRateLimit, requestIp } from "@/lib/rate-limit";
import { neonAuth } from "@/lib/neon-auth-server";
import { ensureNeonAuthUser } from "@/lib/neon-auth-sync";

function redirectWithError(req: Request, message: string) {
  const url = new URL("/register", req.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function POST(req: Request) {
  const rateLimit = consumeRateLimit(`register:${requestIp(req.headers)}`, {
    limit: 5,
    windowMs: 60 * 60_000,
  });
  if (!rateLimit.allowed) {
    return redirectWithError(req, "Muitas tentativas de cadastro. Aguarde e tente novamente.");
  }
  const formData = await req.formData();
  const workshopName = formString(formData, "workshopName");
  const ownerName = formString(formData, "ownerName");
  const email = formString(formData, "email").toLowerCase();
  const phone = formString(formData, "phone");
  const normalizedPhone = normalizePhone(phone);
  const document = normalizeDocument(formString(formData, "document"));
  const password = formString(formData, "password");
  const confirmPassword = formString(formData, "confirmPassword");

  try {
    if (!workshopName || !ownerName || !email || !document || !password) {
      return redirectWithError(req, "Preencha todos os campos obrigatórios.");
    }
    if (!isValidEmail(email)) return redirectWithError(req, "Email inválido.");
    if (!validateCpfCnpj(document)) return redirectWithError(req, "CPF/CNPJ inválido.");
    if (!validatePhone(normalizedPhone)) return redirectWithError(req, "Telefone inválido.");
    if (!validatePassword(password)) return redirectWithError(req, "A senha precisa ter no mínimo 8 caracteres.");
    if (password !== confirmPassword) return redirectWithError(req, "As senhas não conferem.");

    const existing = await prisma.workspace.findFirst({
      where: { OR: [{ document }, { email }, { phone: normalizedPhone }] },
      select: { id: true },
    });
    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    const previousTrial = await prisma.trialIdentity.findFirst({
      where: { OR: [{ document }, { email }, { phone: normalizedPhone }] },
      select: { id: true },
    });
    if (existing || existingUser || previousTrial) {
      return redirectWithError(req, "Este CPF/CNPJ, telefone ou email já utilizou o teste grátis.");
    }

    const passwordHash = await hashPassword(password);
    const registeredAt = new Date();
    const trialStartAt = registeredAt;
    const trialEndsAt = trialEndsAtFrom(registeredAt);
    const workspace = await prisma.$transaction(async (tx) => {
      const createdWorkspace = await tx.workspace.create({
        data: {
          workshopName,
          ownerName,
          email,
          phone: normalizedPhone,
          document,
          trialStartAt,
          trialEndsAt,
          createdAt: registeredAt,
          subscriptionStatus: "TRIAL",
          users: {
            create: {
              name: ownerName,
              email,
              phone: normalizedPhone,
              passwordHash,
              role: "OWNER",
              isActive: true,
              isMechanic: false,
            },
          },
        },
        include: { users: true },
      });
      await tx.trialIdentity.create({
        data: {
          document,
          email,
          phone: normalizedPhone,
          firstTrialStartedAt: registeredAt,
          workspaceId: createdWorkspace.id,
        },
      });
      return createdWorkspace;
    });

    const user = workspace.users[0];
    try {
      await ensureNeonAuthUser(user, password);
      const result = await neonAuth.signIn.email({ email, password, rememberMe: true });
      if (result.error) console.error("Neon Auth não iniciou a sessão do cadastro", result.error);
    } catch (error) {
      console.error("Cadastro criado, mas a sincronização com Neon Auth falhou", error);
    }
    await setSessionCookie({
      userId: user.id,
      workspaceId: workspace.id,
      email: user.email,
      remember: true,
      subscriptionStatus: workspace.subscriptionStatus,
      trialEndsAt: workspace.trialEndsAt,
    });

    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return redirectWithError(req, "Este CPF/CNPJ, telefone ou email já utilizou o teste grátis.");
    }
    console.error("Falha ao criar conta", error);
    return redirectWithError(req, "Não foi possível criar a conta agora. Tente novamente.");
  }
}
