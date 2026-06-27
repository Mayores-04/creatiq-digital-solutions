import { Activity } from "lucide-react";
import { AutoSubmitFilterForm } from "@/components/admin/auto-submit-filter-form";
import { getAdminWorkspace } from "@/lib/crm/admin-data";
import { requireModuleAccess } from "@/lib/crm/auth";

type SearchParams = Promise<{ entity?: string; actor?: string }>;

export default async function ActivityPage({ searchParams }: { searchParams: SearchParams }) {
  await requireModuleAccess("activity");
  const workspace = await getAdminWorkspace();
  const params = await searchParams;
  const names = new Map(workspace.profiles.map((profile) => [profile.id, profile.full_name]));
  const entities = Array.from(new Set(workspace.activity.map((item) => item.entity_type))).sort();
  const filtered = workspace.activity.filter((item) => {
    if (params.entity && item.entity_type !== params.entity) return false;
    if (params.actor && item.actor_id !== params.actor) return false;
    return true;
  });

  return (
    <section className="flex min-h-[calc(100dvh-8rem)] flex-col">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">Audit trail</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-primary sm:text-4xl">Activity</h1>
          <p className="mt-2 text-sm text-muted">A chronological record of CRM changes made by your team.</p>
        </div>
        <AutoSubmitFilterForm className="flex flex-col gap-2 sm:flex-row">
          <select name="entity" defaultValue={params.entity ?? ""} className="h-10 rounded-xl border border-cyan-300/15 bg-surface/60 px-3 text-xs font-bold text-primary outline-none focus:border-secondary">
            <option value="">All activity</option>
            {entities.map((entity) => <option key={entity} value={entity}>{entity.replaceAll("_", " ")}</option>)}
          </select>
          <select name="actor" defaultValue={params.actor ?? ""} className="h-10 rounded-xl border border-cyan-300/15 bg-surface/60 px-3 text-xs font-bold text-primary outline-none focus:border-secondary">
            <option value="">All people</option>
            {workspace.profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name}</option>)}
          </select>
        </AutoSubmitFilterForm>
      </div>

      <div className="mt-6 min-h-0 overflow-hidden rounded-2xl border border-cyan-300/15 bg-surface/60">
        <div className="custom-scrollbar max-h-[min(42rem,calc(100dvh-18rem))] divide-y divide-cyan-300/10 overflow-y-auto">
          {filtered.length ? filtered.map((item) => (
            <article key={item.id} className="flex gap-4 p-4 sm:p-5">
              <span className="mt-0.5 rounded-xl bg-cyan-300/10 p-2 text-secondary"><Activity size={16} /></span>
              <div className="min-w-0">
                <p className="font-semibold text-primary">{item.action.replaceAll("_", " ")} <span className="font-normal text-muted">{item.entity_type.replaceAll("_", " ")}</span></p>
                <p className="mt-1 text-xs text-muted">{item.actor_id ? names.get(item.actor_id) ?? "Team member" : "System"} - {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}</p>
                {Object.keys(item.details).length > 0 ? <p className="mt-2 text-xs leading-5 text-muted">{Object.entries(item.details).map(([key, value]) => `${key}: ${String(value)}`).join(" - ")}</p> : null}
              </div>
            </article>
          )) : <p className="p-10 text-center text-sm text-muted">No activity matches those filters.</p>}
        </div>
      </div>
    </section>
  );
}
