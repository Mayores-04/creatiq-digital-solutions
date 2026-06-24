import { ResourceManager, type ResourceRow } from "@/components/admin/resource-manager";
import { getAdminWorkspace } from "@/lib/crm/admin-data";
import { TASK_STATUSES } from "@/lib/crm/constants";

export default async function TasksPage() {
  const workspace = await getAdminWorkspace();
  const isOwner = workspace.identity.role === "ADMIN";
  return <ResourceManager resource="tasks" title="Tasks" description={isOwner ? "Break project work into accountable tasks, with clear due dates and ownership." : "Update the status of work assigned to you. Your task status rolls into the delivery picture."} rows={workspace.tasks as unknown as ResourceRow[]} canCreate={isOwner} canDelete={isOwner} columns={[{ key: "title", label: "Task" }, { key: "status", label: "Status", kind: "status" }, { key: "due_date", label: "Due", kind: "date" }]} fields={isOwner ? [{ name: "project_id", label: "Project", type: "select", required: true, options: workspace.projects.map((project) => ({ value: project.id, label: project.name })) }, { name: "title", label: "Task title", required: true }, { name: "description", label: "Details", type: "textarea" }, { name: "assignee_id", label: "Assignee", type: "select", options: workspace.profiles.filter((profile) => profile.is_active).map((profile) => ({ value: profile.id, label: profile.full_name })) }, { name: "status", label: "Status", type: "select", required: true, defaultValue: "TODO", options: TASK_STATUSES.map((status) => ({ value: status, label: status.replaceAll("_", " ") })) }, { name: "due_date", label: "Due date", type: "date" }] : [{ name: "status", label: "Status", type: "select", required: true, options: TASK_STATUSES.map((status) => ({ value: status, label: status.replaceAll("_", " ") })) }]} />;
}
