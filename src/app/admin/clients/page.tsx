import { ResourceManager, type ResourceRow } from "@/components/admin/resource-manager";
import { requireAdmin } from "@/lib/crm/auth";
import { getAdminWorkspace } from "@/lib/crm/admin-data";

export default async function ClientsPage() {
  await requireAdmin(["ADMIN"]);
  const workspace = await getAdminWorkspace({ clients: true });
  return <ResourceManager resource="clients" title="Clients" description="Keep client contacts and working notes connected to their projects and originating inquiries." rows={workspace.clients as unknown as ResourceRow[]} canCreate canDelete editInModal hideCreateButton columns={[{ key: "company_name", label: "Company / client" }, { key: "contact_name", label: "Contact" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" }, { key: "created_at", label: "Created", kind: "date" }]} fields={[{ name: "company_name", label: "Company or client name", required: true }, { name: "contact_name", label: "Primary contact" }, { name: "email", label: "Email", type: "email" }, { name: "phone", label: "Phone" }, { name: "notes", label: "Notes", type: "textarea" }]} />;
}
