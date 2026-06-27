import { ProfileForm } from "@/components/admin/profile-form";
import { requireAdmin } from "@/lib/crm/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRecord } from "@/lib/crm/types";

type ProfileResult = {
  data: ProfileRecord | null;
  error: { message: string } | null;
};

export default async function ProfilePage() {
  const identity = await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("profiles")
    .select("id, full_name, email, role, access_role_id, job_title, is_active")
    .eq("id", identity.id)
    .maybeSingle() as ProfileResult;

  if (result.error) throw new Error(`Unable to load profile: ${result.error.message}`);
  return <ProfileForm identity={identity} profile={result.data} />;
}
