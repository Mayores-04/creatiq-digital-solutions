import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { PublicReviewForm } from "@/components/site/public-review-form";
import { getSupabaseConfig, hasSupabaseConfig } from "@/lib/supabase/config";

export default async function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!hasSupabaseConfig()) notFound();
  const { url, publishableKey } = getSupabaseConfig();
  const supabase = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.rpc("get_customer_review_request", { token });
  const review = Array.isArray(data) ? data[0] : null;
  if (error || !review || !review.is_available) return <main className="flex min-h-screen items-center justify-center bg-background p-4 text-center"><div><h1 className="text-3xl font-black text-primary">This review link is unavailable.</h1><p className="mt-3 text-sm text-muted">It may already have been submitted or it has expired.</p></div></main>;
  return <PublicReviewForm token={token} projectName={review.project_name} recipientName={review.recipient_name} />;
}
