import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AdminRole } from "./constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminIdentity = {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
};

export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  // Avoid a remote auth request for visitors who have never signed in. This
  // keeps the /admin redirect immediate when the database is unavailable.
  const cookieStore = await cookies();
  const hasSessionCookie = cookieStore.getAll().some((cookie) =>
    cookie.name.includes("auth-token"),
  );

  if (!hasSessionCookie) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || !profile.is_active) return null;

    return {
      id: user.id,
      email: user.email,
      fullName: profile.full_name,
      role: profile.role as AdminRole,
    };
  } catch {
    // A local marketing site remains usable when Supabase is offline. The
    // protected admin route simply redirects to its sign-in screen.
    return null;
  }
}

export async function requireAdmin(allowedRoles?: AdminRole[]) {
  const identity = await getAdminIdentity();

  if (!identity) redirect("/admin/login");
  if (allowedRoles && !allowedRoles.includes(identity.role)) redirect("/admin");

  return identity;
}
