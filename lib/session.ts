import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

export const COOKIE_NAME = "wsp_session";

export type SessionPayload = {
  userId: string;
  workspaceId: string;
  email: string;
  subscriptionStatus?: string;
  trialEndsAt?: string;
  exp: number;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET precisa estar configurado com uma chave forte.");
  }
  return secret;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createSessionToken(payload: SessionPayload) {
  const body = base64UrlEncode(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token?: string | null): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  try {
    const expected = sign(body);
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    const payload = JSON.parse(base64UrlDecode(body)) as SessionPayload;
    if (!payload.userId || !payload.workspaceId || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function makeSessionPayload(input: {
  userId: string;
  workspaceId: string;
  email: string;
  remember?: boolean;
  subscriptionStatus?: string;
  trialEndsAt?: Date | string;
}) {
  const maxAge = input.remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
  return {
    payload: {
      userId: input.userId,
      workspaceId: input.workspaceId,
      email: input.email,
      subscriptionStatus: input.subscriptionStatus,
      trialEndsAt:
        input.trialEndsAt instanceof Date ? input.trialEndsAt.toISOString() : input.trialEndsAt,
      exp: Date.now() + maxAge * 1000,
    },
    maxAge,
  };
}

export async function setSessionCookie(input: {
  userId: string;
  workspaceId: string;
  email: string;
  remember?: boolean;
  subscriptionStatus?: string;
  trialEndsAt?: Date | string;
}) {
  const { payload, maxAge } = makeSessionPayload(input);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createSessionToken(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function currentSession() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(COOKIE_NAME)?.value);
}

export async function currentUser() {
  const session = await currentSession();
  if (!session) return null;

  return prisma.user.findFirst({
    where: { id: session.userId, workspaceId: session.workspaceId, isActive: true },
    include: { workspace: true },
  });
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
