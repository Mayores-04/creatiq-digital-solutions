import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const DEFAULT_REDIRECT = "/admin/login";

export async function GET(request: NextRequest) {
  const redirectTo = getSafeRedirectPath(request);
  const response = NextResponse.redirect(new URL(redirectTo, request.url));
  const cookieStore = await cookies();

  for (const cookie of cookieStore.getAll()) {
    if (isSupabaseAuthCookie(cookie.name)) {
      cookieStore.delete(cookie.name);
      response.cookies.delete(cookie.name);
      response.cookies.set(cookie.name, "", {
        expires: new Date(0),
        maxAge: 0,
        path: "/",
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
      });
    }
  }

  return response;
}

function getSafeRedirectPath(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next");

  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return DEFAULT_REDIRECT;
  }

  if (next.startsWith("/auth/clear-session")) {
    return DEFAULT_REDIRECT;
  }

  return next;
}

function isSupabaseAuthCookie(name: string) {
  return name.startsWith("sb-") || name.includes("auth-token");
}
