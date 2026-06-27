import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_MODULES, type AdminModuleKey, type AdminRole } from "./constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DEFAULT_STAFF_PERMISSIONS: AdminModuleKey[] = ["overview", "inquiries", "projects", "tasks", "employees", "reports", "notifications"];
const INVALID_SESSION_REDIRECT = "/auth/clear-session?next=%2Fadmin%2Flogin%3Fsession%3Dexpired";

export type AdminIdentity = {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  permissions: AdminModuleKey[];
};

export const getAdminIdentity = cache(async (): Promise<AdminIdentity | null> => {
  // Avoid a remote auth request for visitors who have never signed in. This
  // keeps the /admin redirect immediate when the database is unavailable.
  const cookieStore = await cookies();
  const hasSessionCookie = cookieStore.getAll().some((cookie) =>
    cookie.name.includes("auth-token"),
  );

  if (!hasSessionCookie) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      if (isInvalidRefreshTokenError(userError)) throw userError;
      return null;
    }

    if (!user?.email) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role, access_role_id, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || !profile.is_active) return null;
    let permissions: AdminModuleKey[] = DEFAULT_STAFF_PERMISSIONS;
    if (profile.role === "ADMIN") {
      permissions = ADMIN_MODULES.map((module) => module.key);
    } else if (profile.access_role_id) {
      const { data: accessRole } = await supabase
        .from("access_roles")
        .select("permissions")
        .eq("id", profile.access_role_id)
        .maybeSingle();
      if (Array.isArray(accessRole?.permissions)) {
        const allowed = new Set(ADMIN_MODULES.map((module) => module.key));
        permissions = accessRole.permissions.filter((permission): permission is AdminModuleKey => typeof permission === "string" && allowed.has(permission as AdminModuleKey));
      }
    }

    return {
      id: user.id,
      email: user.email,
      fullName: profile.full_name,
      role: profile.role as AdminRole,
      permissions,
    };
  } catch (error) {
    if (isInvalidRefreshTokenError(error)) redirect(INVALID_SESSION_REDIRECT);

    // A local marketing site remains usable when Supabase is offline. The
    // protected admin route simply redirects to its sign-in screen.
    return null;
  }
});

export async function requireAdmin(allowedRoles?: AdminRole[]) {
  const identity = await getAdminIdentity();

  if (!identity) redirect("/admin/login");
  if (allowedRoles && !allowedRoles.includes(identity.role)) redirect("/admin");

  return identity;
}

export async function requireModuleAccess(module: AdminModuleKey, allowedRoles?: AdminRole[]) {
  const identity = await requireAdmin(allowedRoles);
  if (identity.role !== "ADMIN" && !identity.permissions.includes(module)) redirect("/admin");
  return identity;
}

function isInvalidRefreshTokenError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const candidate = error as { code?: unknown; message?: unknown };
  const code = typeof candidate.code === "string" ? candidate.code : "";
  const message =
    typeof candidate.message === "string" ? candidate.message.toLowerCase() : "";

  return (
    code === "refresh_token_not_found" ||
    message.includes("invalid refresh token") ||
    message.includes("refresh token not found")
  );
}
