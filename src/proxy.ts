import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_GATE_ENABLED =
  process.env.NEXT_PUBLIC_COMING_SOON_MODE !== "false";

const PUBLIC_FILE = /\.(.*)$/;

function isAllowedPath(pathname: string) {
  return (
    pathname === "/coming-soon" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/models") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js" ||
    PUBLIC_FILE.test(pathname)
  );
}

export function proxy(request: NextRequest) {
  if (!PUBLIC_GATE_ENABLED) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (isAllowedPath(pathname)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/coming-soon", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
