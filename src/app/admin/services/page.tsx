import { ResourceManager, type ResourceRow } from "@/components/admin/resource-manager";
import { requireAdmin } from "@/lib/crm/auth";
import { getAdminWorkspace } from "@/lib/crm/admin-data";

export default async function ServicesPage() {
  await requireAdmin(["OWNER"]);
  const workspace = await getAdminWorkspace();
  return <ResourceManager resource="services" title="Services" description="Control the service cards and the selectable services in the public inquiry form." rows={workspace.services as unknown as ResourceRow[]} canCreate canDelete columns={[{ key: "title", label: "Service" }, { key: "slug", label: "Slug" }, { key: "icon_name", label: "Icon" }, { key: "is_published", label: "Published" }, { key: "sort_order", label: "Order" }]} fields={[{ name: "title", label: "Service name", required: true }, { name: "slug", label: "URL slug", required: true, hint: "Lowercase words separated with hyphens." }, { name: "description", label: "Description", type: "textarea", required: true }, { name: "icon_name", label: "Lucide icon name", required: true, defaultValue: "Code2", hint: "Examples: Code2, Brush, Smartphone, PenTool." }, { name: "sort_order", label: "Display order", type: "number", required: true, defaultValue: 0 }, { name: "is_published", label: "Show on public site", type: "checkbox", defaultValue: true }]} />;
}
