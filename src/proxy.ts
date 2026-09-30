import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();
  const hasSessionCookie = Boolean(getSessionCookie(request, { cookiePrefix: "syntavera" }));
  if (hasSessionCookie) return NextResponse.next();
  const loginPath = request.nextUrl.pathname.startsWith("/admin") ? "/admin/login" : "/login";
  const destination = new URL(loginPath, request.url);
  destination.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(destination);
}

export const config = { matcher: ["/admin/:path*", "/portal/:path*"] };
