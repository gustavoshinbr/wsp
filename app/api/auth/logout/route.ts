import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/session";

export async function POST(req: Request) {
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

export async function GET(req: Request) {
  return POST(req);
}
