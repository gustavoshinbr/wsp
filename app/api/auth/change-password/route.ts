import { NextResponse } from "next/server";
import { hashPassword, requireApiUser, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formString } from "@/lib/utils";
import { apiError, ApiError, validatePassword } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const user = await requireApiUser({ allowExpiredSubscription: true });
    const formData = await req.formData();
    const currentPassword = formString(formData, "currentPassword");
    const newPassword = formString(formData, "newPassword");
    const confirmPassword = formString(formData, "confirmPassword");

    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      throw new ApiError("Senha atual inválida.", 400);
    }
    if (!validatePassword(newPassword)) {
      throw new ApiError("A nova senha precisa ter no mínimo 8 caracteres.", 400);
    }
    if (newPassword !== confirmPassword) throw new ApiError("As senhas não conferem.", 400);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(newPassword) },
    });

    return NextResponse.redirect(new URL("/configuracoes?success=senha", req.url));
  } catch (error) {
    const { message } = apiError(error);
    const url = new URL("/configuracoes", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
  }
}
