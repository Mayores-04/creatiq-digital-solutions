import { UserManagement } from "@/components/admin/user-management";
import { requireAdmin } from "@/lib/crm/auth";
import { getAdminWorkspace } from "@/lib/crm/admin-data";

export default async function UsersPage() {
  await requireAdmin(["ADMIN"]);
  const workspace = await getAdminWorkspace({
    profiles: true,
    accessRoles: true,
    adminSecurityRequests: true,
  });
  return <UserManagement profiles={workspace.profiles} currentUserId={workspace.identity.id} accessRoles={workspace.accessRoles} securityRequests={workspace.adminSecurityRequests} />;
}
