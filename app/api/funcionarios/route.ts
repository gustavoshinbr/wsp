import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { hashPassword, requireApiUser, requireManager } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError, isValidEmail, validatePassword } from "@/lib/validations";
import { formNumber, formString } from "@/lib/utils";

export async function GET() {
  try {
    const user = await requireApiUser();
    const employees = await prisma.user.findMany({
      where: { workspaceId: user.workspaceId },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        isMechanic: true,
        specialty: true,
        commissionPercent: true,
      },
    });
    return NextResponse.json(employees);
  } catch (error) {
    const { message, status } = apiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await requireApiUser();
    requireManager(currentUser.role);

    const formData = await req.formData();
    const name = formString(formData, "name");
    const email = formString(formData, "email").toLowerCase();
    const password = formString(formData, "password");
    const role = formString(formData, "role") as UserRole;

    if (!name || !email || !password) throw new ApiError("Nome, email e senha são obrigatórios.");
    if (!isValidEmail(email)) throw new ApiError("Email inválido.");
    if (!validatePassword(password)) throw new ApiError("A senha precisa ter no mínimo 8 caracteres.");
    if (!["ADMIN", "STAFF"].includes(role)) throw new ApiError("Perfil de funcionário inválido.");
    if (currentUser.role === "ADMIN" && role !== "STAFF") {
      throw new ApiError("Apenas o dono pode conceder acesso de administrador.", 403);
    }

    const commissionPercent = formNumber(formData, "commissionPercent");
    if (commissionPercent < 0 || commissionPercent > 100) {
      throw new ApiError("A comissão deve ficar entre 0% e 100%.");
    }

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) throw new ApiError("Email já cadastrado.");

    await prisma.user.create({
      data: {
        workspaceId: currentUser.workspaceId,
        name,
        email,
        phone: formString(formData, "phone") || null,
        passwordHash: await hashPassword(password),
        role,
        isActive: formData.get("isActive") !== "off",
        isMechanic: formData.get("isMechanic") === "on",
        specialty: formString(formData, "specialty") || null,
        commissionPercent: commissionPercent || null,
      },
    });

    return NextResponse.redirect(new URL("/funcionarios", req.url));
  } catch (error) {
    const { message } = apiError(error);
    const url = new URL("/funcionarios", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
  }
}
