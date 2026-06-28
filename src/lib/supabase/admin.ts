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
      "SUPABASE_SERVICE_ROLE_KEY must be the server-only service_role secret from your Supabase dashboard. The configured key is not a service_role key, so admin webhooks, invitations, and secure server writes cannot save data.",
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
