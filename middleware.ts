import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "wsp_session";

type SessionPayload = {
  userId: string;
  workspaceId: string;
  email: string;
  exp: number;
};

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/checkout",
  "/api/auth/login",
  "/api/auth/register",
  "/api/asaas/webhook",
  "/api/pwa/icon",
];

function isPublicPath(pathname: string) {
  return (
    PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/logo-wsp-racing.svg") ||
    pathname.includes(".")
  );
}

function base64UrlToArrayBuffer(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function base64UrlDecode(value: string) {
  return new TextDecoder().decode(base64UrlToArrayBuffer(value));
}

function toBase64Url(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function verifySession(token?: string): Promise<SessionPayload | null> {
  if (!token || !process.env.SESSION_SECRET) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(process.env.SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  if (toBase64Url(digest) !== signature) return null;

  const payload = JSON.parse(base64UrlDecode(body)) as SessionPayload;
  if (Date.now() > payload.exp) return null;
  return payload;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySession(request.cookies.get(COOKIE_NAME)?.value);

  if (isPublicPath(pathname)) {
    if ((pathname === "/login" || pathname === "/register") && session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
