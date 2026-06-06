import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { hashPassword, requireApiUser, requireManager } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError, validatePassword } from "@/lib/validations";
import { formNumber, formString } from "@/lib/utils";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const currentUser = await requireApiUser();
    requireManager(currentUser.role);

    const employee = await prisma.user.findFirst({
      where: { id, workspaceId: currentUser.workspaceId },
    });
    if (!employee) throw new ApiError("Funcionário não encontrado.", 404);
    if (employee.role === "OWNER" && employee.id !== currentUser.id) {
      throw new ApiError("O dono da oficina não pode ser alterado por esta tela.", 403);
    }
    if (currentUser.role === "ADMIN" && employee.role !== "STAFF" && employee.id !== currentUser.id) {
      throw new ApiError("Apenas o dono pode alterar administradores.", 403);
    }

    const formData = await req.formData();
    const method = formString(formData, "_method").toLowerCase();

    if (method === "deactivate") {
      if (employee.id === currentUser.id) throw new ApiError("Você não pode desativar seu próprio usuário.");
      await prisma.user.update({ where: { id: employee.id }, data: { isActive: false } });
    } else if (method === "activate") {
      await prisma.user.update({ where: { id: employee.id }, data: { isActive: true } });
    } else {
      const password = formString(formData, "password");
      const role = (formString(formData, "role") || employee.role) as UserRole;
      if (!["OWNER", "ADMIN", "STAFF"].includes(role)) throw new ApiError("Perfil inválido.");
      if (password && !validatePassword(password)) throw new ApiError("A nova senha precisa ter no mínimo 8 caracteres.");
      if (employee.role !== "OWNER" && employee.id !== currentUser.id && role === "OWNER") {
        throw new ApiError("Não é possível promover outro usuário a dono da oficina.", 403);
      }
      if (currentUser.role === "ADMIN" && employee.id !== currentUser.id && role !== "STAFF") {
        throw new ApiError("Apenas o dono pode conceder acesso de administrador.", 403);
      }

      const commissionPercent = formNumber(formData, "commissionPercent");
      if (commissionPercent < 0 || commissionPercent > 100) {
        throw new ApiError("A comissão deve ficar entre 0% e 100%.");
      }
      const nextRole = employee.role === "OWNER" || employee.id === currentUser.id ? employee.role : role;

      await prisma.user.update({
        where: { id: employee.id },
        data: {
          name: formString(formData, "name") || employee.name,
          phone: formString(formData, "phone") || null,
          role: nextRole,
          isActive: employee.id === currentUser.id ? true : formData.get("isActive") === "on",
          isMechanic: formData.get("isMechanic") === "on",
          specialty: formString(formData, "specialty") || null,
          commissionPercent: commissionPercent || null,
          ...(password ? { passwordHash: await hashPassword(password) } : {}),
        },
      });
    }

    return NextResponse.redirect(new URL("/funcionarios", req.url));
  } catch (error) {
    const { message } = apiError(error);
    const url = new URL("/funcionarios", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
  }
}
