import { ProjectContributors } from "@/components/admin/project-contributors";
import { ProjectDocuments } from "@/components/admin/project-documents";
import {
  ResourceManager,
  type ResourceRow,
} from "@/components/admin/resource-manager";
import { getAdminWorkspace } from "@/lib/crm/admin-data";
import {
  LEAD_OUTCOMES,
  PROJECT_STATUSES,
  PROJECT_TYPES,
} from "@/lib/crm/constants";

export default async function ProjectsPage() {
  const workspace = await getAdminWorkspace({
    projects: true,
    projectServices: true,
    projectMembers: true,
    contributors: true,
    documents: true,
    services: true,
    clients: true,
    profiles: true,
  });
  const isAdmin = workspace.identity.role === "ADMIN";
  const serviceOptions = workspace.services.map((service) => ({
    value: service.id,
    label: service.title,
  }));

  const projectRows = workspace.projects.map((project) => ({
    ...project,
    member_ids: workspace.projectMembers
      .filter((member) => member.project_id === project.id)
      .map((member) => member.profile_id),
    service_ids: project.service_ids.length
      ? project.service_ids
      : project.service_id
        ? [project.service_id]
        : [],
    service_titles: project.service_titles.length
      ? project.service_titles
      : project.category
        ? [project.category]
        : [],
    technologies: project.technologies.join(", "),
  }));

  const adminFields = [
    { name: "name", label: "Project name", required: true },
    {
      name: "slug",
      label: "Public slug",
      hint: "Used for the public project record. Lowercase words and hyphens work best.",
    },
    {
      name: "description",
      label: "Project brief",
      type: "textarea" as const,
      fullWidth: true,
    },
    {
      name: "service_ids",
      label: "Service categories",
      type: "multi-select" as const,
      options: serviceOptions,
      hint: "Select every service this project belongs to. Example: Web & Custom Systems + Mobile App.",
      fullWidth: true,
    },
    {
      name: "project_type",
      label: "Project type",
      type: "select" as const,
      required: true,
      defaultValue: "CLIENT",
      options: PROJECT_TYPES.map((type) => ({
        value: type,
        label: type.replaceAll("_", " "),
      })),
    },
    {
      name: "category",
      label: "Fallback category",
      hint: "Used only when no service category is selected.",
    },
    {
      name: "client_id",
      label: "Client",
      type: "select" as const,
      options: workspace.clients.map((client) => ({
        value: client.id,
        label: client.company_name,
      })),
    },
    {
      name: "lead_outcome",
      label: "Commercial outcome",
      type: "select" as const,
      required: true,
      defaultValue: "OPEN",
      options: LEAD_OUTCOMES.map((outcome) => ({
        value: outcome,
        label: outcome,
      })),
    },
    {
      name: "lost_reason",
      label: "Lost reason",
      type: "textarea" as const,
      hint: "Use only for lost leads; this makes pipeline loss analysis useful.",
      fullWidth: true,
    },
    {
      name: "status",
      label: "Delivery stage",
      type: "select" as const,
      required: true,
      options: PROJECT_STATUSES.map((status) => ({
        value: status,
        label: status.replaceAll("_", " "),
      })),
    },
    {
      name: "progress",
      label: "Progress (%)",
      type: "number" as const,
      required: true,
      defaultValue: 0,
    },
    { name: "start_date", label: "Start date", type: "date" as const },
    { name: "due_date", label: "Due date", type: "date" as const },
    {
      name: "member_ids",
      label: "Assigned employees",
      type: "multi-select" as const,
      options: workspace.profiles
        .filter((profile) => profile.is_active)
        .map((profile) => ({
          value: profile.id,
          label: `${profile.full_name}${profile.job_title ? ` — ${profile.job_title}` : ""}`,
        })),
      hint: "Select one or more employees assigned to this work.",
      fullWidth: true,
    },
    { name: "project_url", label: "Live project / repository URL" },
    {
      name: "technologies",
      label: "Technologies",
      hint: "Separate technologies with commas.",
    },
    { name: "project_date", label: "Project date" },
    { name: "asset_size", label: "Original asset size" },
    { name: "source_image_path", label: "Original image path" },
    {
      name: "image_url",
      label: "Public project image",
      type: "image-upload" as const,
      fullWidth: true,
    },
    { name: "image_public_id", label: "Cloudinary public ID" },
    {
      name: "sort_order",
      label: "Public display order",
      type: "number" as const,
      required: true,
      defaultValue: 0,
    },
    {
      name: "is_published",
      label: "Publish to the website",
      type: "checkbox" as const,
      defaultValue: false,
    },
    {
      name: "is_featured",
      label: "Feature this project",
      type: "checkbox" as const,
      defaultValue: false,
    },
  ];

  const staffFields = [
    {
      name: "status",
      label: "Stage",
      type: "select" as const,
      required: true,
      options: PROJECT_STATUSES.map((status) => ({
        value: status,
        label: status.replaceAll("_", " "),
      })),
    },
    {
      name: "progress",
      label: "Progress (%)",
      type: "number" as const,
      required: true,
    },
  ];

  return (
    <div className="space-y-6">
      <ResourceManager
        resource="projects"
        title="Projects"
        description={
          isAdmin
            ? "One source of truth for personal, team, and client work — from service category and contributors through delivery and website visibility."
            : "Update progress on projects assigned to you. Admins manage commercial outcomes, contributors, and public publishing."
        }
        rows={projectRows as unknown as ResourceRow[]}
        filterKeys={[
          "name",
          "service_titles",
          "project_type",
          "lead_outcome",
          "status",
        ]}
        canCreate={isAdmin}
        canDelete={isAdmin}
        editorMode="modal"
        columns={[
          { key: "name", label: "Project" },
          { key: "service_titles", label: "Services", kind: "list" },
          { key: "project_type", label: "Project Type", kind: "status" },
          { key: "lead_outcome", label: "Outcome", kind: "status" },
          { key: "status", label: "Stage", kind: "status" },
          { key: "progress", label: "Progress", kind: "progress" },
          { key: "due_date", label: "Due", kind: "date" },
        ]}
        fields={isAdmin ? adminFields : staffFields}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <ProjectContributors
          projects={workspace.projects}
          contributors={workspace.contributors}
          profiles={workspace.profiles}
          isAdmin={isAdmin}
        />
        <ProjectDocuments
          projects={workspace.projects}
          documents={workspace.documents}
        />
      </div>
    </div>
  );
}
