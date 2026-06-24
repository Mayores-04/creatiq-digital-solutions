"use client";

import { FormEvent, useMemo, useState } from "react";
import { Trash2, UserPlus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { removeProjectContributor, saveExternalContributor } from "@/app/admin/actions";
import type { ProfileRecord, ProjectContributorRecord, ProjectRecord } from "@/lib/crm/types";

export function ProjectContributors({ projects, contributors, profiles, isAdmin }: { projects: ProjectRecord[]; contributors: ProjectContributorRecord[]; profiles: ProfileRecord[]; isAdmin: boolean }) {
  const router = useRouter();
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const current = useMemo(() => contributors.filter((contributor) => contributor.project_id === projectId), [contributors, projectId]);
  const names = new Map(profiles.map((profile) => [profile.id, profile.full_name]));

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true);
    const result = await saveExternalContributor({ projectId, name: String(values.get("name") ?? ""), email: String(values.get("email") ?? ""), role: String(values.get("role") ?? "") });
    setBusy(false);
    if (!result.ok) toast.error("Couldn’t add contributor", { description: result.error });
    else { toast.success(result.message); event.currentTarget.reset(); router.refresh(); }
  }

  async function remove(id: string) {
    const result = await removeProjectContributor(id);
    if (!result.ok) toast.error("Couldn’t remove contributor", { description: result.error });
    else { toast.success(result.message); router.refresh(); }
  }

  return <section className="rounded-2xl border border-cyan-300/15 bg-surface/50 p-5"><div className="flex items-start gap-3"><span className="rounded-xl bg-cyan-300/10 p-2 text-secondary"><UsersRound size={17} /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Project team</p><h2 className="text-lg font-black text-primary">Contributors</h2><p className="mt-1 text-xs leading-5 text-muted">Employee assignments are managed in the project editor. Add collaborators outside the company here.</p></div></div>{projects.length ? <><select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="mt-4 h-10 w-full rounded-xl border border-cyan-300/15 bg-background/60 px-3 text-sm text-primary outline-none focus:border-secondary">{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><div className="mt-4 divide-y divide-cyan-300/10">{current.length ? current.map((contributor) => <div key={contributor.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-bold text-primary">{contributor.profile_id ? names.get(contributor.profile_id) ?? "Employee" : contributor.external_name}</p><p className="mt-1 text-xs text-muted">{contributor.contribution_role || "Contributor"}{contributor.external_email ? ` · ${contributor.external_email}` : ""}</p></div>{isAdmin && !contributor.profile_id && <button onClick={() => remove(contributor.id)} className="rounded-lg p-2 text-red-200 hover:bg-red-300/10" aria-label="Remove external contributor"><Trash2 size={15} /></button>}</div>) : <p className="py-4 text-center text-xs text-muted">No contributors listed for this project yet.</p>}</div>{isAdmin && <form onSubmit={add} className="mt-4 grid gap-2 border-t border-cyan-300/10 pt-4 sm:grid-cols-2"><input required name="name" placeholder="External contributor name" className="h-10 rounded-xl border border-cyan-300/15 bg-background/60 px-3 text-sm text-primary outline-none focus:border-secondary" /><input name="email" type="email" placeholder="Email (optional)" className="h-10 rounded-xl border border-cyan-300/15 bg-background/60 px-3 text-sm text-primary outline-none focus:border-secondary" /><input name="role" placeholder="Contribution role" className="h-10 rounded-xl border border-cyan-300/15 bg-background/60 px-3 text-sm text-primary outline-none focus:border-secondary sm:col-span-2" /><button disabled={busy} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-cyan-300/25 text-xs font-bold text-secondary hover:bg-cyan-300/10 sm:col-span-2"><UserPlus size={15} />{busy ? "Adding..." : "Add external contributor"}</button></form>}</> : <p className="mt-4 text-sm text-muted">Create a project before adding contributors.</p>}</section>;
}
