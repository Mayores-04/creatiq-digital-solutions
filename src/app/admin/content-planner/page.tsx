import { ContentPlanner } from "@/components/admin/content-planner";
import { getAdminWorkspace } from "@/lib/crm/admin-data";
import { requireModuleAccess } from "@/lib/crm/auth";

export default async function ContentPlannerPage() {
  await requireModuleAccess("content-planner");
  const workspace = await getAdminWorkspace();
  return (
    <ContentPlanner
      items={workspace.contentPlannerItems}
      profiles={workspace.profiles}
      projects={workspace.projects}
      services={workspace.services}
    />
  );
}
