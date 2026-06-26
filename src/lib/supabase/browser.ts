"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";
import { fetchWithSupabaseTimeout } from "./request";

type SupabaseBrowserClient = ReturnType<typeof createBrowserClient>;

let browserClient: SupabaseBrowserClient | null = null;

export function createSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  const { url, publishableKey } = getSupabaseConfig();

  browserClient = createBrowserClient(url, publishableKey, {
    global: {
      fetch: fetchWithSupabaseTimeout,
    },
    auth: {
      /**
       * Keep this false because your SetPasswordPage already manually handles:
       * - access_token / refresh_token
       * - code exchange
       *
       * This helps prevent Supabase from auto-processing the same invite URL.
       */
      detectSessionInUrl: false,
    },
  });

  return browserClient;
}
