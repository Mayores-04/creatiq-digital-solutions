import { Activity, Bell, ShieldCheck } from "lucide-react";

import { NotificationSettings } from "@/components/admin/notification-settings";
import {
  PaginationControls,
  type PageSize,
} from "@/components/admin/pagination-controls";
import { getAdminWorkspace } from "@/lib/crm/admin-data";

type SearchParams = Promise<{
  page?: string;
  limit?: string;
}>;

type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
  type: "crm" | "security" | "system";
};

const allowedPageSizes: PageSize[] = [25, 50, 100, "all"];

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const page = normalizePage(params.page);
  const pageSize = normalizePageSize(params.limit);

  const workspace = await getAdminWorkspace();

  const names = new Map(
    workspace.profiles.map((profile) => [profile.id, profile.full_name]),
  );

  const notifications: NotificationItem[] = workspace.activity
    .map((item) => {
      const actorName = item.actor_id
        ? (names.get(item.actor_id) ?? "Team member")
        : "System";

      const entity = item.entity_type.replaceAll("_", " ");
      const action = item.action.replaceAll("_", " ");
      const details = formatDetails(item.details);

      return {
        id: item.id,
        title: `${action} ${entity}`,
        detail: details
          ? `${actorName} · ${details}`
          : `${actorName} made an update in the CRM workspace.`,
        createdAt: item.created_at,
        type: getNotificationType(item.entity_type),
      };
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const total = notifications.length;

  const paginatedNotifications = paginateNotifications(
    notifications,
    page,
    pageSize,
  );

  return (
    <section className="flex min-h-0 flex-col space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
            Activity center
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-primary sm:text-4xl">
            Track alerts and audit logs in one place.
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Review important alerts, CRM movement, workspace changes, and audit
            history in one unified center.
          </p>
        </div>

        <a
          href="#notification-settings"
          className="inline-flex items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-secondary transition hover:bg-cyan-300/15"
        >
          Configure settings
        </a>
      </div>

      <div className="grid min-h-0 gap-5 xl:grid-cols-[1fr_22rem]">
        <div className="min-h-0 overflow-hidden rounded-2xl border border-cyan-300/15 bg-surface/60">
          <div className="flex items-center justify-between gap-4 border-b border-cyan-300/10 px-5 py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
                See all notifications
              </p>

              <p className="mt-1 text-xs text-muted">
                Showing CRM updates and workspace alerts.
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-cyan-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-secondary">
              {total} total
            </span>
          </div>

          <div className="custom-scrollbar max-h-[calc(100dvh-22rem)] min-h-[24rem] overflow-y-auto">
            {paginatedNotifications.length ? (
              <div className="divide-y divide-cyan-300/10">
                {paginatedNotifications.map((item) => (
                  <NotificationRow key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[24rem] items-center justify-center p-6 text-center">
                <div>
                  <Bell className="mx-auto text-secondary" size={32} />

                  <p className="mt-3 text-sm font-bold text-primary">
                    No notifications yet.
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted">
                    New CRM movement will appear here once your workspace has
                    activity.
                  </p>
                </div>
              </div>
            )}
          </div>

          <PaginationControls page={page} pageSize={pageSize} total={total} />
        </div>

        <NotificationSettings />
      </div>
    </section>
  );
}

function NotificationRow({ item }: { item: NotificationItem }) {
  const Icon = item.type === "security" ? ShieldCheck : Activity;

  return (
    <article className="flex gap-4 p-5 transition hover:bg-cyan-300/[0.04]">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-secondary">
        <Icon size={17} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="text-sm font-bold capitalize text-primary">
            {item.title}
          </h2>

          <time className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-muted/70">
            {formatTime(item.createdAt)}
          </time>
        </div>

        <p className="mt-1 text-xs leading-5 text-muted">{item.detail}</p>
      </div>
    </article>
  );
}

function normalizePage(value: string | undefined) {
  const page = Number(value);

  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }

  return Math.floor(page);
}

function normalizePageSize(value: string | undefined): PageSize {
  if (value === "all") {
    return "all";
  }

  const size = Number(value);

  if (allowedPageSizes.includes(size as PageSize)) {
    return size as PageSize;
  }

  return 25;
}

function paginateNotifications(
  notifications: NotificationItem[],
  page: number,
  pageSize: PageSize,
) {
  if (pageSize === "all") {
    return notifications;
  }

  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return notifications.slice(start, end);
}

function getNotificationType(entityType: string): NotificationItem["type"] {
  const type = entityType.toLowerCase();

  if (
    type.includes("user") ||
    type.includes("profile") ||
    type.includes("role") ||
    type.includes("auth")
  ) {
    return "security";
  }

  return "crm";
}

function formatDetails(details: Record<string, unknown>) {
  return Object.entries(details)
    .map(([key, value]) => `${key}: ${formatDetailValue(value)}`)
    .join(" · ");
}

function formatDetailValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return JSON.stringify(value);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
