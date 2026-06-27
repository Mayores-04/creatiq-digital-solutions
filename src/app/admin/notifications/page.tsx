import { Activity, Bell, ShieldCheck } from "lucide-react";
import { NotificationSettings } from "@/components/admin/notification-settings";
import { PaginationControls, type PageSize } from "@/components/admin/pagination-controls";
import { requireModuleAccess } from "@/lib/crm/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActivityRecord, ProfileRecord } from "@/lib/crm/types";

type SearchParams = Promise<{ page?: string; limit?: string; type?: string }>;
type ActivityResult = { data: ActivityRecord[] | null; error: { message: string } | null; count: number | null };
type ProfilesResult = { data: Pick<ProfileRecord, "id" | "full_name">[] | null; error: { message: string } | null };

const allowedPageSizes: PageSize[] = [25, 50, 100, "all"];

export default async function AdminNotificationsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireModuleAccess("notifications");
  const params = await searchParams;
  const page = normalizePage(params.page);
  const pageSize = normalizePageSize(params.limit);
  const type = params.type ?? "";
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("activity_logs")
    .select("id, actor_id, entity_type, entity_id, action, details, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (type === "security") query = query.in("entity_type", ["profile", "access_role"]);
  if (type === "reviews") query = query.eq("entity_type", "customer_review");
  if (type === "content") query = query.eq("entity_type", "content_planner");

  if (pageSize !== "all") {
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);
  }

  const [activityResult, profilesResult] = await Promise.all([
    query as unknown as PromiseLike<ActivityResult>,
    supabase.from("profiles").select("id, full_name") as unknown as PromiseLike<ProfilesResult>,
  ]);

  if (activityResult.error) throw new Error(`Unable to load notifications: ${activityResult.error.message}`);
  if (profilesResult.error) throw new Error(`Unable to load people: ${profilesResult.error.message}`);

  const names = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile.full_name]));
  const notifications = activityResult.data ?? [];
  const total = activityResult.count ?? notifications.length;

  return (
    <section className="flex min-h-[calc(100dvh-8rem)] flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">Activity Center</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-primary sm:text-4xl">Notifications</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Review CRM alerts, workspace changes, and security-sensitive account updates.</p>
        </div>
        <a href="#notification-settings" className="inline-flex items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-secondary transition hover:bg-cyan-300/15">
          Configure settings
        </a>
      </div>

      <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-cyan-300/15 bg-surface/60">
          <div className="flex flex-col gap-3 border-b border-cyan-300/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">See all notifications</p>
              <p className="mt-1 text-xs text-muted">Showing CRM updates and workspace alerts.</p>
            </div>
            <form className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="limit" value={pageSize} />
              <select name="type" defaultValue={type} className="h-10 rounded-xl border border-cyan-300/15 bg-background/60 px-3 text-xs font-bold text-primary outline-none focus:border-secondary">
                <option value="">All</option>
                <option value="security">Security</option>
                <option value="reviews">Customer reviews</option>
                <option value="content">Content planner</option>
              </select>
              <button className="h-10 rounded-xl border border-cyan-300/20 px-4 text-[10px] font-black uppercase tracking-widest text-secondary hover:bg-cyan-300/10">Filter</button>
              <span className="rounded-full bg-cyan-300/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-secondary">{total} total</span>
            </form>
          </div>

          <div className="min-h-0 flex-1 divide-y divide-cyan-300/10 overflow-y-auto">
            {notifications.length ? notifications.map((item) => (
              <NotificationRow key={item.id} item={item} actorName={item.actor_id ? names.get(item.actor_id) ?? "Team member" : "System"} />
            )) : (
              <div className="flex min-h-[24rem] items-center justify-center p-6 text-center">
                <div>
                  <Bell className="mx-auto text-secondary" size={32} />
                  <p className="mt-3 text-sm font-bold text-primary">No notifications yet.</p>
                  <p className="mt-1 text-xs leading-5 text-muted">New CRM movement will appear here once your workspace has activity.</p>
                </div>
              </div>
            )}
          </div>

          <PaginationControls page={page} pageSize={pageSize} total={total} extraParams={type ? { type } : undefined} />
        </div>

        <NotificationSettings />
      </div>
    </section>
  );
}

function NotificationRow({ item, actorName }: { item: ActivityRecord; actorName: string }) {
  const security = ["profile", "access_role"].includes(item.entity_type);
  const Icon = security ? ShieldCheck : Activity;
  const details = formatDetails(item.details);
  return (
    <article className="flex gap-4 p-5 transition hover:bg-cyan-300/[0.04]">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-secondary"><Icon size={17} /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="text-sm font-bold capitalize text-primary">{item.action.replaceAll("_", " ")} <span className="font-normal text-muted">{item.entity_type.replaceAll("_", " ")}</span></h2>
          <time className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-muted/70">{formatTime(item.created_at)}</time>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted">{details ? `${actorName} - ${details}` : `${actorName} made an update in the CRM workspace.`}</p>
      </div>
    </article>
  );
}

function normalizePage(value: string | undefined) {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function normalizePageSize(value: string | undefined): PageSize {
  if (value === "all") return "all";
  const size = Number(value);
  return allowedPageSizes.includes(size as PageSize) ? size as PageSize : 25;
}

function formatDetails(details: Record<string, unknown>) {
  return Object.entries(details).map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`).join(" - ");
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}
