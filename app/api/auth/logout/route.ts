import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/session";
import { neonAuth } from "@/lib/neon-auth-server";

export async function POST(req: Request) {
  await neonAuth.signOut().catch(() => null);
  const response = NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
