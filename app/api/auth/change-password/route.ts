import { NextResponse } from "next/server";
import { hashPassword, requireApiUser, verifyPassword } from "@/lib/auth";
import { neonAuth } from "@/lib/neon-auth-server";
import { ensureNeonAuthUser } from "@/lib/neon-auth-sync";
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

    if (!validatePassword(newPassword)) {
      throw new ApiError("A nova senha precisa ter no mínimo 8 caracteres.", 400);
    }
    if (newPassword !== confirmPassword) throw new ApiError("As senhas não conferem.", 400);

    if (user.authProvider === "NEON" && user.externalAuthId) {
      const changed = await neonAuth.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (changed.error) throw new ApiError("Senha atual inválida.", 400);
    } else {
      if (!(await verifyPassword(currentPassword, user.passwordHash))) {
        throw new ApiError("Senha atual inválida.", 400);
      }
      await ensureNeonAuthUser(user, currentPassword);
      const signedIn = await neonAuth.signIn.email({
        email: user.email,
        password: currentPassword,
      });
      if (signedIn.error) throw new ApiError("Não foi possível sincronizar a senha com o Neon Auth.", 502);
      const changed = await neonAuth.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (changed.error) throw new ApiError("Não foi possível atualizar a senha no Neon Auth.", 502);
    }

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
