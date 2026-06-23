import { AdminDashboard } from "@/components/admin/dashboard";
import { getAdminWorkspace } from "@/lib/crm/admin-data";

export default async function AdminDashboardPage() {
  return <AdminDashboard workspace={await getAdminWorkspace()} />;
}
