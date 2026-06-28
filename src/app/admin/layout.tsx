import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import {
  AdminHeader,
  type AdminNotification,
} from "@/components/admin/admin-header";
import { AdminLiveSync } from "@/components/admin/admin-live-sync";
import { AdminSidebar } from "@/components/admin/sidebar";
import { getAdminIdentity } from "@/lib/crm/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const identity = await getAdminIdentity();

  // The login route lives beneath /admin, so it also receives this layout.
  // Let unauthenticated children render; each protected CRM page calls
  // requireAdmin/getAdminWorkspace and redirects independently.
  if (!identity) return children;

  async function signOut() {
    "use server";

    const supabase = await createSupabaseServerClient();

    await supabase.auth.signOut();

    redirect("/admin/login");
  }

  const supabase = await createSupabaseServerClient();

  const [activityResult, profilesResult] = await Promise.all([
    supabase
      .from("activity_logs")
      .select("id, actor_id, entity_type, action, details, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("profiles").select("id, full_name"),
  ]);

  const names = new Map(
    (profilesResult.data ?? []).map((profile) => [
      profile.id,
      profile.full_name,
    ]),
  );

  const notifications: AdminNotification[] = (activityResult.data ?? []).map(
    (item) => ({
      id: item.id,
      title: `${item.action.replaceAll("_", " ")} ${item.entity_type.replaceAll("_", " ")}`,
      detail: `${
        item.actor_id ? (names.get(item.actor_id) ?? "Team member") : "System"
      }${formatDetails(item.details)}`,
      createdAt: item.created_at,
    }),
  );

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <AdminSidebar role={identity.role} permissions={identity.permissions} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:pl-72">
        <AdminLiveSync />
        <AdminHeader
          identity={identity}
          notifications={notifications}
          signOutAction={signOut}
        />

        <main className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
          <div className="min-h-full w-full max-w-full p-3 sm:p-4 md:p-5 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function formatDetails(details: unknown) {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return "";
  }

  const entries = Object.entries(details);

  if (!entries.length) {
    return "";
  }

  return ` - ${entries
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(", ")}`;
}
