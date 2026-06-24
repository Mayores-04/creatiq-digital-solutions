"use client";

import { type FormEvent, useState } from "react";
import { Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateMyProfile } from "@/app/admin/actions";
import type { AdminIdentity } from "@/lib/crm/auth";
import type { ProfileRecord } from "@/lib/crm/types";

export function ProfileForm({ identity, profile }: { identity: AdminIdentity; profile: ProfileRecord | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true);
    const result = await updateMyProfile({
      fullName: String(values.get("fullName") ?? ""),
      jobTitle: String(values.get("jobTitle") ?? ""),
    });
    setBusy(false);
    if (!result.ok) toast.error("Could not update profile", { description: result.error });
    else {
      toast.success(result.message);
      router.refresh();
    }
  }

  return (
    <section className="max-w-3xl">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">Account</p>
      <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-primary sm:text-4xl">Profile</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Manage how your name and role appear across the Creatiq CRM workspace.</p>

      <form onSubmit={submit} className="mt-6 rounded-2xl border border-cyan-300/15 bg-surface/60 p-5 sm:p-7">
        <div className="flex items-center gap-3 rounded-2xl border border-cyan-300/10 bg-background/35 p-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-secondary"><UserRound size={22} /></span>
          <div className="min-w-0">
            <p className="truncate font-black text-primary">{identity.fullName}</p>
            <p className="mt-1 truncate text-xs text-muted">{identity.email} - {identity.role}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Full name</span>
            <input required name="fullName" defaultValue={profile?.full_name ?? identity.fullName} className="mt-1.5 h-11 w-full rounded-xl border border-cyan-300/15 bg-background/60 px-3 text-sm text-primary outline-none focus:border-secondary" />
          </label>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Job title</span>
            <input name="jobTitle" defaultValue={profile?.job_title ?? ""} className="mt-1.5 h-11 w-full rounded-xl border border-cyan-300/15 bg-background/60 px-3 text-sm text-primary outline-none focus:border-secondary" />
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <button disabled={busy} className="primary-btn inline-flex h-11 items-center gap-2 rounded-xl px-5 text-xs font-black uppercase tracking-widest text-white disabled:opacity-60">
            <Save size={15} />
            {busy ? "Saving..." : "Save profile"}
          </button>
        </div>
      </form>
    </section>
  );
}
