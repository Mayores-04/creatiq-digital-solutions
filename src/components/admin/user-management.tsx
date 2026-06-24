"use client";

import { FormEvent, useState } from "react";
import { Power, Send, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { inviteStaff, setUserActive, setUserRole } from "@/app/admin/actions";
import type { ProfileRecord } from "@/lib/crm/types";

export function UserManagement({ profiles, currentUserId }: { profiles: ProfileRecord[]; currentUserId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [pendingDeactivation, setPendingDeactivation] = useState<ProfileRecord | null>(null);

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    const values = new FormData(form);
    const result = await inviteStaff({
      email: String(values.get("email") ?? ""),
      fullName: String(values.get("fullName") ?? ""),
      jobTitle: String(values.get("jobTitle") ?? ""),
      role: String(values.get("role") ?? "STAFF") as "ADMIN" | "STAFF",
    });
    setBusy(false);
    if (!result.ok) toast.error("Could not invite user", { description: result.error });
    else {
      toast.success(result.message);
      form.reset();
      router.refresh();
    }
  }

  async function changeRole(profileId: string, role: "ADMIN" | "STAFF") {
    const result = await setUserRole(profileId, role);
    if (!result.ok) toast.error("Could not update role", { description: result.error });
    else {
      toast.success(result.message);
      router.refresh();
    }
  }

  async function changeAccess(profile: ProfileRecord, nextActive: boolean, confirmedCoAdmin = false) {
    if (profile.id === currentUserId && !nextActive) {
      toast.error("You cannot deactivate your own account", { description: "Ask another Admin to change your access if needed." });
      return;
    }
    if (profile.role === "ADMIN" && profile.is_active && !nextActive && !confirmedCoAdmin) {
      setPendingDeactivation(profile);
      return;
    }

    setBusy(true);
    const result = await setUserActive(profile.id, nextActive, confirmedCoAdmin);
    setBusy(false);
    setPendingDeactivation(null);
    if (!result.ok) toast.error("Could not update account access", { description: result.error });
    else {
      toast.success(result.message);
      router.refresh();
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">Access control</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-primary sm:text-4xl">User management</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Admins manage company configuration, publishing, and access. You cannot deactivate your own account or change your own role.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <form onSubmit={invite} className="h-fit rounded-2xl border border-cyan-300/15 bg-surface/60 p-5">
          <div className="flex items-center gap-2">
            <Send size={17} className="text-secondary" />
            <h2 className="font-black text-primary">Invite a user</h2>
          </div>
          <p className="mt-2 text-xs leading-5 text-muted">The invite creates a secure Auth account and employee profile. Send Staff by default; create an Admin only when needed.</p>
          <div className="mt-5 space-y-3">
            <Field label="Full name" name="fullName" required />
            <Field label="Work email" name="email" type="email" required />
            <Field label="Job title" name="jobTitle" />
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Access role</span>
              <select name="role" defaultValue="STAFF" className="mt-1.5 h-11 w-full rounded-xl border border-cyan-300/15 bg-background/60 px-3 text-sm text-primary outline-none focus:border-secondary">
                <option value="STAFF">Staff / Employee</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>
          </div>
          <button disabled={busy} className="primary-btn mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-widest text-white disabled:opacity-60">
            <Send size={15} />
            {busy ? "Sending..." : "Send secure invite"}
          </button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-cyan-300/15 bg-surface/60">
          <div className="border-b border-cyan-300/10 px-5 py-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-secondary" />
              <h2 className="font-black text-primary">Team accounts</h2>
            </div>
          </div>
          <div className="max-h-[36rem] divide-y divide-cyan-300/10 overflow-y-auto">
            {profiles.map((profile) => {
              const isSelf = profile.id === currentUserId;
              return (
                <div key={profile.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-primary">
                      {profile.full_name}
                      {isSelf && <span className="ml-2 rounded-full bg-cyan-300/10 px-2 py-1 text-[9px] font-bold text-secondary">YOU</span>}
                    </p>
                    <p className="mt-1 text-xs text-muted">{profile.email}{profile.job_title ? ` - ${profile.job_title}` : ""}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${profile.is_active ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-300/10 text-amber-200"}`}>
                      {profile.is_active ? "ACTIVE" : "INACTIVE"}
                    </span>
                    <select value={profile.role} disabled={isSelf || busy} onChange={(event) => changeRole(profile.id, event.target.value as "ADMIN" | "STAFF")} className="rounded-lg border border-cyan-300/20 bg-background/60 px-2 py-1.5 text-xs font-bold text-primary outline-none focus:border-secondary disabled:cursor-not-allowed disabled:opacity-50">
                      <option value="ADMIN">ADMIN</option>
                      <option value="STAFF">STAFF</option>
                    </select>
                    <button
                      type="button"
                      disabled={(isSelf && profile.is_active) || busy}
                      onClick={() => changeAccess(profile, !profile.is_active)}
                      className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[10px] font-black uppercase tracking-widest transition disabled:cursor-not-allowed disabled:opacity-45 ${profile.is_active ? "border-red-300/25 text-red-200 hover:bg-red-300/10" : "border-emerald-300/25 text-emerald-200 hover:bg-emerald-300/10"}`}
                    >
                      <Power size={13} />
                      {profile.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {pendingDeactivation ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-3 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Confirm co-admin deactivation">
          <div className="w-full max-w-md rounded-2xl border border-red-300/20 bg-surface p-5 shadow-[0_0_40px_rgba(248,113,113,0.12)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-200">Confirmation required</p>
                <h2 className="mt-2 text-xl font-black text-primary">Deactivate co-admin?</h2>
              </div>
              <button type="button" onClick={() => setPendingDeactivation(null)} className="rounded-lg p-2 text-muted hover:bg-cyan-300/10 hover:text-primary" aria-label="Close confirmation">
                <X size={16} />
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">
              You are about to deactivate <span className="font-bold text-primary">{pendingDeactivation.full_name}</span>. This co-admin will lose access to the CRM until another Admin reactivates the account.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={() => setPendingDeactivation(null)} className="h-11 flex-1 rounded-xl border border-cyan-300/20 text-xs font-black uppercase tracking-widest text-muted hover:bg-cyan-300/10">
                Cancel
              </button>
              <button type="button" disabled={busy} onClick={() => changeAccess(pendingDeactivation, false, true)} className="h-11 flex-1 rounded-xl bg-red-400/15 text-xs font-black uppercase tracking-widest text-red-100 hover:bg-red-400/20 disabled:opacity-60">
                Confirm deactivate
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Field({ label, name, type = "text", required = false }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">{label}</span>
      <input required={required} name={name} type={type} className="mt-1.5 h-11 w-full rounded-xl border border-cyan-300/15 bg-background/60 px-3 text-sm text-primary outline-none focus:border-secondary" />
    </label>
  );
}
