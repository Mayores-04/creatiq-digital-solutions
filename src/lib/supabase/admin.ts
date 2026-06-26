import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";
import { fetchWithSupabaseTimeout } from "./request";

function getJwtRole(token: string) {
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { role?: unknown };
    return typeof decoded.role === "string" ? decoded.role : null;
  } catch {
    return null;
  }
}

export function createSupabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  const keyRole = getJwtRole(serviceRoleKey);
  if (keyRole && keyRole !== "service_role") {
    throw new Error(
      "User invitations require the Supabase service_role secret. Replace SUPABASE_SERVICE_ROLE_KEY with the server-only service_role key from your Supabase dashboard.",
    );
  }

  const { url } = getSupabaseConfig();

  return createClient(url, serviceRoleKey, {
    global: { fetch: fetchWithSupabaseTimeout },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
