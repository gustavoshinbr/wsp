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
  "/forgot-password",
  "/reset-password",
  "/docs/manual-wsp-racing.pdf",
  "/checkout",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth",
  "/api/asaas/webhook",
  "/api/pwa/icon",
];

function isPublicPath(pathname: string) {
  const isPublicAsset = /\.(?:avif|css|gif|ico|jpe?g|js|json|map|png|svg|txt|webmanifest|webp|woff2?)$/i.test(pathname);
  return (
    PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/logo-wsp-racing.svg") ||
    isPublicAsset
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

async function verifySession(token?: string): Promise<SessionPayload | null> {
  if (!token || !process.env.SESSION_SECRET) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(process.env.SESSION_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToArrayBuffer(signature),
      new TextEncoder().encode(body),
    );
    if (!valid) return null;

    const payload = JSON.parse(base64UrlDecode(body)) as SessionPayload;
    if (!payload.userId || !payload.workspaceId || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const unsafeMethod = !["GET", "HEAD", "OPTIONS"].includes(request.method);
  if (unsafeMethod && pathname.startsWith("/api/") && pathname !== "/api/asaas/webhook") {
    if (request.headers.get("sec-fetch-site") === "cross-site") {
      return NextResponse.json({ error: "Requisição entre sites bloqueada." }, { status: 403 });
    }
    const source = request.headers.get("origin") || request.headers.get("referer");
    if (!source) return NextResponse.json({ error: "Origem da requisição ausente." }, { status: 403 });
    try {
      if (new URL(source).origin !== request.nextUrl.origin) {
        return NextResponse.json({ error: "Origem da requisição inválida." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Origem da requisição inválida." }, { status: 403 });
    }
  }
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
