import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "yayra_session";

async function readSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (!payload.sub) return null;
    return { id: payload.sub as string };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const session = await readSession(request);
  const pathname = request.nextUrl.pathname;

  if (!session && (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard/add-profile", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/signup"],
};
