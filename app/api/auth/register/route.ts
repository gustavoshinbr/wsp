import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAsaasCustomer } from "@/lib/asaas";
import { hashPassword } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";
import { addDays, formString, normalizeDocument } from "@/lib/utils";
import { isValidEmail, validateCpfCnpj, validatePassword } from "@/lib/validations";

function redirectWithError(req: Request, message: string) {
  const url = new URL("/register", req.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const workshopName = formString(formData, "workshopName");
  const ownerName = formString(formData, "ownerName");
  const email = formString(formData, "email").toLowerCase();
  const phone = formString(formData, "phone");
  const document = normalizeDocument(formString(formData, "document"));
  const password = formString(formData, "password");
  const confirmPassword = formString(formData, "confirmPassword");

  try {
    if (!workshopName || !ownerName || !email || !document || !password) {
      return redirectWithError(req, "Preencha todos os campos obrigatórios.");
    }
    if (!isValidEmail(email)) return redirectWithError(req, "Email inválido.");
    if (!validateCpfCnpj(document)) return redirectWithError(req, "CPF/CNPJ inválido.");
    if (!validatePassword(password)) return redirectWithError(req, "A senha precisa ter no mínimo 8 caracteres.");
    if (password !== confirmPassword) return redirectWithError(req, "As senhas não conferem.");

    const existing = await prisma.workspace.findFirst({
      where: { OR: [{ document }, { email }] },
      select: { id: true },
    });
    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing || existingUser) {
      return redirectWithError(req, "Email ou CPF/CNPJ já cadastrado.");
    }

    const trialStartAt = new Date();
    const trialEndsAt = addDays(trialStartAt, 7);
    const customer = await createAsaasCustomer({
      name: workshopName,
      email,
      phone,
      cpfCnpj: document,
      externalReference: document,
    });

    const passwordHash = await hashPassword(password);
    const workspace = await prisma.workspace.create({
      data: {
        workshopName,
        ownerName,
        email,
        phone,
        document,
        trialStartAt,
        trialEndsAt,
        subscriptionStatus: "TRIAL",
        asaasCustomerId: customer.id,
        users: {
          create: {
            name: ownerName,
            email,
            phone,
            passwordHash,
            role: "OWNER",
            isActive: true,
            isMechanic: false,
          },
        },
      },
      include: { users: true },
    });

    const user = workspace.users[0];
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
    const message = error instanceof Error ? error.message : "Erro ao criar conta.";
    return redirectWithError(req, message);
  }
}
