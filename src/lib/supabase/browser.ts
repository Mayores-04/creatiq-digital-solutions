"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";
import { fetchWithSupabaseTimeout } from "./request";

export function createSupabaseBrowserClient() {
  const { url, publishableKey } = getSupabaseConfig();
  return createBrowserClient(url, publishableKey, { global: { fetch: fetchWithSupabaseTimeout } });
}
