import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const redirectTo = new URL("/admin", url.origin);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!code || !supabaseUrl || !supabaseKey) return NextResponse.redirect(new URL("/admin/login", url.origin));

  const response = NextResponse.redirect(redirectTo);
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.headers.get("cookie")?.split(";").map((item) => {
        const [name, ...value] = item.trim().split("=");
        return { name, value: value.join("=") };
      }) ?? [],
      setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });

  await supabase.auth.exchangeCodeForSession(code);
  return response;
}
