import { InquiryConversion } from "@/components/admin/inquiry-conversion";
import { ResourceManager, type ResourceRow } from "@/components/admin/resource-manager";
import { getAdminWorkspace } from "@/lib/crm/admin-data";
import { INQUIRY_STATUSES } from "@/lib/crm/constants";

export default async function InquiriesPage() {
  const workspace = await getAdminWorkspace();
  const isOwner = workspace.identity.role === "ADMIN";
  const clientOptions = workspace.clients.map((client) => ({ value: client.id, label: client.company_name }));
  const projectOptions = workspace.projects.map((project) => ({ value: project.id, label: project.name }));
  return <div className="space-y-6"><ResourceManager resource="inquiries" title="Inquiries" description="Track every incoming website lead, qualify the opportunity, and retain the project context in one place." rows={workspace.inquiries as unknown as ResourceRow[]} columns={[{ key: "name", label: "Lead" }, { key: "email", label: "Email" }, { key: "services", label: "Services", kind: "list" }, { key: "status", label: "Status", kind: "status" }, { key: "created_at", label: "Received", kind: "date" }]} fields={[{ name: "status", label: "Lead status", type: "select", required: true, options: INQUIRY_STATUSES.map((status) => ({ value: status, label: status.replaceAll("_", " ") })) }, { name: "internal_notes", label: "Internal notes", type: "textarea", placeholder: "Add context for the team..." }, ...(isOwner ? [{ name: "client_id", label: "Linked client", type: "select" as const, options: clientOptions }, { name: "project_id", label: "Linked project", type: "select" as const, options: projectOptions }] : [])]} />{isOwner && <InquiryConversion inquiries={workspace.inquiries} />}</div>;
}
