import {
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  Inbox,
  TriangleAlert,
} from "lucide-react";
import type { AdminWorkspace } from "@/lib/crm/types";
import { getDashboardMetrics } from "@/lib/crm/admin-data";

export function AdminDashboard({ workspace }: { workspace: AdminWorkspace }) {
  const metrics = getDashboardMetrics(workspace);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
            Creatiq command center
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-primary sm:text-4xl">
            Good work starts with a clear view.
          </h1>
          <p className="mt-2 text-sm text-muted">
            Here’s the live pulse of your studio operations.
          </p>
        </div>
        <div className="rounded-xl border border-cyan-300/15 bg-cyan-300/5 px-3 py-2 text-xs text-muted">
          Signed in as{" "}
          <span className="font-bold text-secondary">
            {workspace.identity.fullName}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={Inbox}
          label="Inquiries"
          value={metrics.totalInquiries}
          detail={`${metrics.recentInquiries} in the last 30 days`}
        />
        <Metric
          icon={FolderKanban}
          label="Active projects"
          value={metrics.activeProjects}
          detail={`${workspace.projects.length} visible in your workspace`}
        />
        <Metric
          icon={CheckCircle2}
          label="Task completion"
          value={`${metrics.taskCompletion}%`}
          detail={`${workspace.tasks.filter((task) => task.status === "DONE").length} completed tasks`}
        />
        <Metric
          icon={TriangleAlert}
          label="Overdue work"
          value={metrics.overdueTasks}
          detail={
            metrics.overdueTasks ? "Needs attention today" : "Nothing overdue"
          }
          warn={metrics.overdueTasks > 0}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <div className="rounded-2xl border border-cyan-300/15 bg-surface/60 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">
                Project pipeline
              </p>
              <h2 className="mt-1 text-xl font-black text-primary">
                Work across every stage
              </h2>
            </div>
            <ArrowUpRight className="text-secondary" size={20} />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {metrics.pipeline.map((stage) => (
              <div
                key={stage.status}
                className="rounded-xl border border-cyan-300/10 bg-background/30 p-4"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                  {stage.status.replaceAll("_", " ")}
                </p>
                <p className="mt-2 text-3xl font-black text-primary">
                  {stage.count}
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary/10">
                  <div
                    className="h-full rounded-full bg-secondary"
                    style={{
                      width: `${workspace.projects.length ? (stage.count / workspace.projects.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-cyan-300/15 bg-surface/60 p-5 sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">
            Conversion health
          </p>
          <h2 className="mt-1 text-xl font-black text-primary">
            Inquiry momentum
          </h2>
          <div className="mt-6 flex items-end gap-5">
            <p className="text-5xl font-black text-secondary">
              {metrics.conversionRate}%
            </p>
            <p className="pb-1 text-sm leading-5 text-muted">
              of all inquiries have become a client project.
            </p>
          </div>
          <div className="mt-6 rounded-xl bg-cyan-300/8 p-4">
            <p className="text-sm font-semibold text-primary">
              {metrics.converted} converted inquiry
              {metrics.converted === 1 ? "" : "ies"}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Use the Inquiries workspace to qualify a lead and create its
              linked client and project.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-2xl border border-cyan-300/15 bg-surface/60 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-secondary" />
            <h2 className="text-lg font-black text-primary">Overdue tasks</h2>
          </div>
          {metrics.overdue.length ? (
            <div className="mt-4 divide-y divide-cyan-300/10">
              {metrics.overdue.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-primary">{task.title}</p>
                    <p className="mt-1 text-xs text-muted">
                      Due {task.due_date}
                    </p>
                  </div>
                  <span className="rounded-full bg-red-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-200">
                    Overdue
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-emerald-400/8 p-4 text-sm text-emerald-200">
              All clear—there are no overdue tasks in this workspace.
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-cyan-300/15 bg-surface/60 p-5 sm:p-6">
          <h2 className="text-lg font-black text-primary">Employee workload</h2>
          <div className="mt-4 space-y-3">
            {metrics.workload.map((member) => (
              <div
                key={member.name}
                className="rounded-xl border border-cyan-300/10 bg-background/25 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-primary">
                    {member.name}
                  </p>
                  <p className="text-xs text-secondary">
                    {member.openTasks} open
                  </p>
                </div>
                <p
                  className={`mt-1 text-xs ${member.overdueTasks ? "text-red-200" : "text-muted"}`}
                >
                  {member.overdueTasks
                    ? `${member.overdueTasks} overdue`
                    : "On track"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
  warn = false,
}: {
  icon: typeof Inbox;
  label: string;
  value: string | number;
  detail: string;
  warn?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-cyan-300/15 bg-surface/60 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
            {label}
          </p>
          <p
            className={`mt-3 text-3xl font-black ${warn ? "text-amber-200" : "text-primary"}`}
          >
            {value}
          </p>
        </div>
        <span
          className={`rounded-xl p-2.5 ${warn ? "bg-amber-300/10 text-amber-200" : "bg-cyan-300/10 text-secondary"}`}
        >
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted">{detail}</p>
    </article>
  );
}
