"use server";

import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function submitPublicReview(values: { token: string; name: string; email: string; rating: number; testimonial: string }) {
  try {
    const token = z.uuid().parse(values.token);
    const { url, publishableKey } = getSupabaseConfig();
    const supabase = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await supabase.rpc("submit_customer_review", { token, submitted_name: values.name, submitted_email: values.email, submitted_rating: values.rating, submitted_testimonial: values.testimonial });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  } catch (error) { return { ok: false as const, error: error instanceof Error ? error.message : "Unable to submit your review." }; }
}
