import { CompanySettingsForm } from "@/components/admin/company-settings-form";
import { requireAdmin } from "@/lib/crm/auth";
import { getAdminWorkspace } from "@/lib/crm/admin-data";

export default async function SettingsPage() {
  await requireAdmin(["OWNER"]);
  const workspace = await getAdminWorkspace();
  return <CompanySettingsForm settings={workspace.settings} />;
}
