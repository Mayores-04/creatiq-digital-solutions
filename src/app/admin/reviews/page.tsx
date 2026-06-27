import { ReviewsManager } from "@/components/admin/reviews-manager";
import { requireAdmin } from "@/lib/crm/auth";
import { getAdminWorkspace } from "@/lib/crm/admin-data";

export default async function ReviewsPage() {
  await requireAdmin(["ADMIN"]);
  const workspace = await getAdminWorkspace({
    reviews: true,
    projects: true,
    clients: true,
  });
  return <ReviewsManager reviews={workspace.reviews} projects={workspace.projects} clients={workspace.clients} />;
}
