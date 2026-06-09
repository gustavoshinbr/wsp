import { randomBytes } from "crypto";
import { neonAuth } from "@/lib/neon-auth-server";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/validations";

type LocalUserIdentity = {
  id: string;
  email: string;
  name: string;
  authProvider?: string | null;
  externalAuthId?: string | null;
};

async function findNeonUserId(email: string) {
  const users = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id::text AS id
    FROM neon_auth."user"
    WHERE lower(email) = lower(${email})
    LIMIT 1
  `;
  return users[0]?.id || null;
}

function authErrorMessage(error: { message?: string; code?: string } | null | undefined) {
  return error?.message || error?.code || "O Neon Auth recusou a operação.";
}

export async function ensureNeonAuthUser(
  user: LocalUserIdentity,
  password?: string,
) {
  if (user.authProvider === "NEON" && user.externalAuthId) {
    return user.externalAuthId;
  }

  let neonUserId = await findNeonUserId(user.email);
  if (!neonUserId) {
    const temporaryPassword = password || randomBytes(48).toString("base64url");
    const result = await neonAuth.signUp.email({
      email: user.email,
      name: user.name,
      password: temporaryPassword,
    });
    if (result.error) {
      neonUserId = await findNeonUserId(user.email);
      if (!neonUserId) throw new ApiError(authErrorMessage(result.error), 502);
    } else {
      neonUserId = result.data?.user.id || null;
    }
  }

  if (!neonUserId) throw new ApiError("Não foi possível sincronizar a conta com o Neon Auth.", 502);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      authProvider: "NEON",
      externalAuthId: neonUserId,
    },
  });
  return neonUserId;
}

export async function requestNeonPasswordReset(email: string, redirectTo: string) {
  const result = await neonAuth.requestPasswordReset({ email, redirectTo });
  if (result.error) throw new ApiError(authErrorMessage(result.error), 502);
}

export async function resetNeonPassword(token: string, newPassword: string) {
  const result = await neonAuth.resetPassword({ token, newPassword });
  if (result.error) throw new ApiError(authErrorMessage(result.error), 400);
}
