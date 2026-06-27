import { CompanySettingsForm } from "@/components/admin/company-settings-form";
import { requireAdmin } from "@/lib/crm/auth";
import { getAdminWorkspace } from "@/lib/crm/admin-data";

export default async function SettingsPage() {
  await requireAdmin(["ADMIN"]);
  const workspace = await getAdminWorkspace({
    settings: true,
  });
  return (
    <div className="space-y-6">
      <CompanySettingsForm settings={workspace.settings} />
    </div>
  );
}
