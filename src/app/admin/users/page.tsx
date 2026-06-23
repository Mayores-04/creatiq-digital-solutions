import { UserManagement } from "@/components/admin/user-management";
import { requireAdmin } from "@/lib/crm/auth";
import { getAdminWorkspace } from "@/lib/crm/admin-data";

export default async function UsersPage() {
  await requireAdmin(["OWNER"]);
  const workspace = await getAdminWorkspace();
  return <UserManagement profiles={workspace.profiles} />;
}
