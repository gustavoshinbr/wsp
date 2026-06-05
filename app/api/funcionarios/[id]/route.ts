import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { hashPassword, requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError, validatePassword } from "@/lib/validations";
import { formNumber, formString } from "@/lib/utils";

function requireManager(role: UserRole) {
  if (role !== "OWNER" && role !== "ADMIN") {
    throw new ApiError("Apenas dono ou administrador pode gerenciar funcionários.", 403);
  }
}

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

    const formData = await req.formData();
    const method = formString(formData, "_method").toLowerCase();

    if (method === "deactivate") {
      if (employee.id === currentUser.id) throw new ApiError("Você não pode desativar seu próprio usuário.");
      await prisma.user.update({ where: { id: employee.id }, data: { isActive: false } });
    } else if (method === "activate") {
      await prisma.user.update({ where: { id: employee.id }, data: { isActive: true } });
    } else {
      const password = formString(formData, "password");
      const role = formString(formData, "role") as UserRole;
      if (!["OWNER", "ADMIN", "STAFF"].includes(role)) throw new ApiError("Perfil inválido.");
      if (password && !validatePassword(password)) throw new ApiError("A nova senha precisa ter no mínimo 8 caracteres.");

      await prisma.user.update({
        where: { id: employee.id },
        data: {
          name: formString(formData, "name") || employee.name,
          phone: formString(formData, "phone") || null,
          role: employee.role === "OWNER" ? "OWNER" : role,
          isActive: formData.get("isActive") === "on",
          isMechanic: formData.get("isMechanic") === "on",
          specialty: formString(formData, "specialty") || null,
          commissionPercent: formNumber(formData, "commissionPercent") || null,
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
