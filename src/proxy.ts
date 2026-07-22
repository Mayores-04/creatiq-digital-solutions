import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_GATE_ENABLED =
  process.env.COMING_SOON_MODE !== "false" &&
  process.env.NEXT_PUBLIC_COMING_SOON_MODE !== "false";

const ACCESS_QUERY_PARAM = "preview_key";
const ACCESS_COOKIE = "creatiq_preview_access";
const ACCESS_TOKEN = process.env.COMING_SOON_ACCESS_TOKEN?.trim();

const PUBLIC_FILE = /\.(.*)$/;

function isAlwaysAllowedPath(pathname: string) {
  return (
    pathname === "/coming-soon" ||
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

function hasValidPreviewAccess(request: NextRequest) {
  if (!ACCESS_TOKEN) return false;

  return request.cookies.get(ACCESS_COOKIE)?.value === ACCESS_TOKEN;
}

function hasValidPreviewKey(request: NextRequest) {
  if (!ACCESS_TOKEN) return false;

  return request.nextUrl.searchParams.get(ACCESS_QUERY_PARAM) === ACCESS_TOKEN;
}

function createPreviewResponse(request: NextRequest) {
  const nextUrl = request.nextUrl.clone();

  nextUrl.searchParams.delete(ACCESS_QUERY_PARAM);

  if (nextUrl.pathname === "/coming-soon") {
    nextUrl.pathname = "/";
  }

  const response = NextResponse.redirect(nextUrl);

  response.cookies.set({
    name: ACCESS_COOKIE,
    value: ACCESS_TOKEN ?? "",
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

export function proxy(request: NextRequest) {
  if (!PUBLIC_GATE_ENABLED) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (hasValidPreviewKey(request)) {
    return createPreviewResponse(request);
  }

  if (isAlwaysAllowedPath(pathname) || hasValidPreviewAccess(request)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/coming-soon", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
