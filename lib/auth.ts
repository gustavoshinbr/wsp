import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentSession, currentUser, requireUser } from "@/lib/session";
import { requireApiWorkspaceAccess, requireWorkspaceAccess } from "@/lib/subscription";
import { ApiError } from "@/lib/validations";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function requirePageUser(options?: { allowExpiredSubscription?: boolean }) {
  const user = await requireUser();
  if (!options?.allowExpiredSubscription) requireWorkspaceAccess(user.workspace);
  return user;
}

export async function requireApiUser(options?: { allowExpiredSubscription?: boolean }) {
  const session = await currentSession();
  if (!session) throw new ApiError("Não autenticado.", 401);

  const user = await prisma.user.findFirst({
    where: { id: session.userId, workspaceId: session.workspaceId, isActive: true },
    include: { workspace: true },
  });

  if (!user) throw new ApiError("Sessão inválida.", 401);
  if (!options?.allowExpiredSubscription) requireApiWorkspaceAccess(user.workspace);
  return user;
}

export async function redirectIfAuthenticated() {
  const user = await currentUser();
  if (user) redirect("/dashboard");
}
