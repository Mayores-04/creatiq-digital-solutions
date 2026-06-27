import { CompanySettingsForm } from "@/components/admin/company-settings-form";
import { ModuleAccessSettings } from "@/components/admin/module-access-settings";
import { requireAdmin } from "@/lib/crm/auth";
import { getAdminWorkspace } from "@/lib/crm/admin-data";

export default async function SettingsPage() {
  await requireAdmin(["ADMIN"]);
  const workspace = await getAdminWorkspace();
  return (
    <div className="space-y-6">
      <CompanySettingsForm settings={workspace.settings} />
      <ModuleAccessSettings accessRoles={workspace.accessRoles} />
    </div>
  );
}
