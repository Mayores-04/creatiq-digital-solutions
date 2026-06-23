"use client";

import { FormEvent, useState } from "react";
import { Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { inviteStaff, setUserRole } from "@/app/admin/actions";
import type { ProfileRecord } from "@/lib/crm/types";

export function UserManagement({ profiles }: { profiles: ProfileRecord[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const values = new FormData(event.currentTarget);
    const result = await inviteStaff({ email: String(values.get("email") ?? ""), fullName: String(values.get("fullName") ?? ""), jobTitle: String(values.get("jobTitle") ?? "") });
    setBusy(false);
    if (!result.ok) toast.error("Couldn’t invite team member", { description: result.error });
    else { toast.success(result.message); event.currentTarget.reset(); router.refresh(); }
  }

  async function changeRole(profileId: string, role: "OWNER" | "STAFF") {
    const result = await setUserRole(profileId, role);
    if (!result.ok) toast.error("Couldn’t update role", { description: result.error });
    else { toast.success(result.message); router.refresh(); }
  }

  return <section className="space-y-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">Access control</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-primary sm:text-4xl">User management</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Owners control company configuration, publishing, and team access. Staff can work on assigned delivery and inquiry operations.</p></div><div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]"><form onSubmit={invite} className="h-fit rounded-2xl border border-cyan-300/15 bg-surface/60 p-5"><div className="flex items-center gap-2"><Send size={17} className="text-secondary" /><h2 className="font-black text-primary">Invite Staff</h2></div><p className="mt-2 text-xs leading-5 text-muted">An email invite lets a new team member create their own password. Public registration remains disabled.</p><div className="mt-5 space-y-3"><Field label="Full name" name="fullName" required /><Field label="Work email" name="email" type="email" required /><Field label="Job title" name="jobTitle" /></div><button disabled={busy} className="primary-btn mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-widest text-white disabled:opacity-60"><Send size={15} />{busy ? "Sending..." : "Send invite"}</button></form><div className="overflow-hidden rounded-2xl border border-cyan-300/15 bg-surface/60"><div className="border-b border-cyan-300/10 px-5 py-4"><div className="flex items-center gap-2"><ShieldCheck size={17} className="text-secondary" /><h2 className="font-black text-primary">Team accounts</h2></div></div><div className="divide-y divide-cyan-300/10">{profiles.map((profile) => <div key={profile.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-primary">{profile.full_name}</p><p className="mt-1 text-xs text-muted">{profile.email}{profile.job_title ? ` · ${profile.job_title}` : ""}</p></div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${profile.is_active ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-300/10 text-amber-200"}`}>{profile.is_active ? "ACTIVE" : "INACTIVE"}</span><select value={profile.role} onChange={(event) => changeRole(profile.id, event.target.value as "OWNER" | "STAFF")} className="rounded-lg border border-cyan-300/20 bg-background/60 px-2 py-1.5 text-xs font-bold text-primary outline-none focus:border-secondary"><option value="OWNER">OWNER</option><option value="STAFF">STAFF</option></select></div></div>)}</div></div></div></section>;
}

function Field({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) { return <label className="block"><span className="text-[10px] font-bold uppercase tracking-widest text-secondary">{label}</span><input required={required} name={name} type={type} className="mt-1.5 h-11 w-full rounded-xl border border-cyan-300/15 bg-background/60 px-3 text-sm text-primary outline-none focus:border-secondary" /></label>; }
