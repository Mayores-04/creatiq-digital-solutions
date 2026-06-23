import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { getAdminIdentity } from "@/lib/crm/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: ReactNode }) {
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

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[16rem_1fr]">
      <AdminSidebar role={identity.role} />
      <div className="min-w-0">
        <header className="flex min-h-16 items-center justify-between border-b border-cyan-300/15 bg-surface/70 px-4 py-3 sm:px-6 lg:px-8">
          <div><p className="text-sm font-bold text-primary">{identity.fullName}</p><p className="text-[10px] font-bold uppercase tracking-widest text-secondary">{identity.role}</p></div>
          <form action={signOut}><button className="inline-flex h-10 items-center gap-2 rounded-lg border border-cyan-300/20 px-3 text-xs font-bold uppercase tracking-widest text-muted transition hover:border-secondary hover:text-secondary"><LogOut size={15} />Sign out</button></form>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
