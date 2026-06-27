import "server-only";

import { requireAdmin } from "./auth";
import type {
  ActivityRecord,
  AccessRoleRecord,
  AdminSecurityRequestRecord,
  AdminWorkspace,
  ClientRecord,
  CompanySettingsRecord,
  InquiryRecord,
  ProfileRecord,
  ProjectRecord,
  ProjectDocumentRecord,
  ProjectContributorRecord,
  ProjectServiceRecord,
  CustomerReviewRecord,
  ContentPlannerItemRecord,
  ServiceRecord,
  TaskRecord,
} from "./types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type QueryResult<T> = { data: T | null; error: { message: string } | null };
type AdminWorkspaceInclude = Partial<Record<keyof Omit<AdminWorkspace, "identity">, boolean>>;

const ALL_ADMIN_WORKSPACE_SECTIONS: Required<AdminWorkspaceInclude> = {
  profiles: true,
  accessRoles: true,
  adminSecurityRequests: true,
  clients: true,
  inquiries: true,
  projects: true,
  projectServices: true,
  projectMembers: true,
  contributors: true,
  tasks: true,
  documents: true,
  services: true,
  reviews: true,
  activity: true,
  contentPlannerItems: true,
  settings: true,
};

const emptyList = Promise.resolve({ data: [], error: null });
const emptySingle = Promise.resolve({ data: null, error: null });

function rows<T>(result: QueryResult<T[]>, label: string): T[] {
  if (result.error) throw new Error(`Unable to load ${label}: ${result.error.message}`);
  return result.data ?? [];
}

function row<T>(result: QueryResult<T>, label: string): T | null {
  if (result.error) throw new Error(`Unable to load ${label}: ${result.error.message}`);
  return result.data;
}

export async function getAdminWorkspace(include?: AdminWorkspaceInclude): Promise<AdminWorkspace> {
  const identity = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const sections = include ? { ...emptyAdminWorkspaceSections(), ...include } : ALL_ADMIN_WORKSPACE_SECTIONS;
  const adminOnly = identity.role === "ADMIN";
  const needsProjectServices = sections.projectServices || sections.projects;
  const [profilesResult, accessRolesResult, securityRequestsResult, clientsResult, inquiriesResult, projectsResult, projectServicesResult, membersResult, contributorsResult, tasksResult, documentsResult, servicesResult, reviewsResult, activityResult, contentPlannerResult, settingsResult] = await Promise.all([
    sections.profiles
      ? supabase.from("profiles").select("id, full_name, email, role, access_role_id, job_title, is_active").order("full_name")
      : emptyList,
    adminOnly && sections.accessRoles
      ? supabase.from("access_roles").select("id, name, description, permissions, is_system, created_at").order("name")
      : emptyList,
    adminOnly && sections.adminSecurityRequests
      ? supabase.from("admin_security_requests").select("id, request_token, action, target_profile_id, requested_by, requested_role, status, expires_at, created_at").eq("status", "PENDING").order("created_at", { ascending: false })
      : emptyList,
    sections.clients
      ? supabase.from("clients").select("id, company_name, contact_name, email, phone, notes, created_at").order("created_at", { ascending: false })
      : emptyList,
    sections.inquiries
      ? supabase.from("inquiries").select("id, name, email, services, description, status, internal_notes, client_id, project_id, created_at").order("created_at", { ascending: false })
      : emptyList,
    sections.projects
      ? supabase.from("projects").select("id, slug, service_id, client_id, inquiry_id, name, description, status, progress, start_date, due_date, completed_at, category, project_type, lead_outcome, lost_reason, is_published, is_featured, image_url, image_public_id, project_url, technologies, project_date, asset_size, source_image_path, sort_order, created_at").order("created_at", { ascending: false })
      : emptyList,
    needsProjectServices
      ? supabase.from("project_services").select("project_id, service_id, services(title)").order("project_id")
      : emptyList,
    sections.projectMembers
      ? supabase.from("project_members").select("project_id, profile_id")
      : emptyList,
    sections.contributors
      ? supabase.from("project_contributors").select("id, project_id, profile_id, external_name, external_email, contribution_role")
      : emptyList,
    sections.tasks
      ? supabase.from("tasks").select("id, project_id, title, description, status, assignee_id, due_date, created_at").order("due_date", { ascending: true, nullsFirst: false })
      : emptyList,
    sections.documents
      ? supabase.from("project_documents").select("id, project_id, file_name, storage_path, mime_type, byte_size, uploaded_by, created_at").order("created_at", { ascending: false })
      : emptyList,
    sections.services
      ? supabase.from("services").select("id, slug, title, description, icon_name, sort_order, is_published").order("sort_order")
      : emptyList,
    adminOnly && sections.reviews
      ? supabase.from("customer_reviews").select("id, request_token, client_id, project_id, recipient_email, recipient_name, customer_name, customer_email, rating, testimonial, status, submitted_at, created_at").order("created_at", { ascending: false })
      : emptyList,
    sections.activity
      ? supabase.from("activity_logs").select("id, actor_id, entity_type, entity_id, action, details, created_at").order("created_at", { ascending: false }).limit(80)
      : emptyList,
    sections.contentPlannerItems
      ? supabase.from("content_planner_items").select("id, title, channel, content_type, status, planned_for, description, owner_id, project_id, service_id, media_assets, platform_targets, automation_metadata, created_at").order("planned_for", { ascending: true })
      : emptyList,
    adminOnly && sections.settings
      ? supabase.from("company_settings").select("company_name, company_email, location, logo_url, favicon_url, social_links").eq("id", true).maybeSingle()
      : emptySingle,
  ]);

  const projectServices = rows(projectServicesResult as QueryResult<(ProjectServiceRecord & { services?: { title?: string } | { title?: string }[] | null })[]>, "project service categories");
  const serviceIdsByProject = new Map<string, string[]>();
  const serviceTitlesByProject = new Map<string, string[]>();

  for (const link of projectServices) {
    const titles = Array.isArray(link.services) ? link.services : link.services ? [link.services] : [];
    serviceIdsByProject.set(link.project_id, [...(serviceIdsByProject.get(link.project_id) ?? []), link.service_id]);
    serviceTitlesByProject.set(link.project_id, [
      ...(serviceTitlesByProject.get(link.project_id) ?? []),
      ...titles.map((service) => service.title).filter((title): title is string => Boolean(title)),
    ]);
  }

  const services = rows(servicesResult as QueryResult<ServiceRecord[]>, "services");
  const serviceTitleById = new Map(services.map((service) => [service.id, service.title]));

  return {
    identity,
    profiles: rows(profilesResult as QueryResult<ProfileRecord[]>, "employees"),
    accessRoles: rows(accessRolesResult as QueryResult<AccessRoleRecord[]>, "access roles").map((role) => ({
      ...role,
      permissions: Array.isArray(role.permissions) ? role.permissions.map(String) : [],
    })),
    adminSecurityRequests: rows(securityRequestsResult as QueryResult<AdminSecurityRequestRecord[]>, "admin security requests"),
    clients: rows(clientsResult as QueryResult<ClientRecord[]>, "clients"),
    inquiries: rows(inquiriesResult as QueryResult<InquiryRecord[]>, "inquiries").map((inquiry) => ({
      ...inquiry,
      services: Array.isArray(inquiry.services) ? inquiry.services : [],
    })),
    projects: rows(projectsResult as QueryResult<Omit<ProjectRecord, "service_ids" | "service_titles">[]>, "projects").map((project) => {
      const serviceIds = serviceIdsByProject.get(project.id) ?? (project.service_id ? [project.service_id] : []);
      const serviceTitles = serviceTitlesByProject.get(project.id) ?? serviceIds.map((serviceId) => serviceTitleById.get(serviceId)).filter((title): title is string => Boolean(title));

      return {
        ...project,
        service_ids: serviceIds,
        service_titles: serviceTitles,
        technologies: Array.isArray(project.technologies) ? project.technologies : [],
      };
    }),
    projectServices: projectServices.map(({ project_id, service_id }) => ({ project_id, service_id })),
    projectMembers: rows(membersResult as QueryResult<{ project_id: string; profile_id: string }[]>, "project assignments"),
    contributors: rows(contributorsResult as QueryResult<ProjectContributorRecord[]>, "project contributors"),
    tasks: rows(tasksResult as QueryResult<TaskRecord[]>, "tasks"),
    documents: rows(documentsResult as QueryResult<ProjectDocumentRecord[]>, "project documents"),
    services,
    reviews: rows(reviewsResult as QueryResult<CustomerReviewRecord[]>, "customer reviews"),
    activity: rows(activityResult as QueryResult<ActivityRecord[]>, "activity"),
    contentPlannerItems: rows(contentPlannerResult as QueryResult<ContentPlannerItemRecord[]>, "content planner").map((item) => ({
      ...item,
      media_assets: Array.isArray(item.media_assets) ? item.media_assets : [],
      platform_targets: Array.isArray(item.platform_targets) ? item.platform_targets.map(String) : [],
      automation_metadata: item.automation_metadata && typeof item.automation_metadata === "object" && !Array.isArray(item.automation_metadata) ? item.automation_metadata : {},
    })),
    settings: row(settingsResult as QueryResult<CompanySettingsRecord>, "company settings"),
  };
}

function emptyAdminWorkspaceSections(): Required<AdminWorkspaceInclude> {
  return {
    profiles: false,
    accessRoles: false,
    adminSecurityRequests: false,
    clients: false,
    inquiries: false,
    projects: false,
    projectServices: false,
    projectMembers: false,
    contributors: false,
    tasks: false,
    documents: false,
    services: false,
    reviews: false,
    activity: false,
    contentPlannerItems: false,
    settings: false,
  };
}

export function getDashboardMetrics(workspace: AdminWorkspace) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const daysAgo = new Date(now);
  daysAgo.setDate(daysAgo.getDate() - 30);

  const recentInquiries = workspace.inquiries.filter((inquiry) => new Date(inquiry.created_at) >= daysAgo);
  const converted = workspace.inquiries.filter((inquiry) => inquiry.status === "CONVERTED").length;
  const doneTasks = workspace.tasks.filter((task) => task.status === "DONE").length;
  const openTasks = workspace.tasks.filter((task) => task.status !== "DONE");
  const overdueTasks = openTasks.filter((task) => task.due_date && task.due_date < today);
  const activeProjects = workspace.projects.filter((project) => ["ACTIVE", "REVIEW"].includes(project.status));
  const wonProjects = workspace.projects.filter((project) => project.lead_outcome === "WON").length;
  const lostProjects = workspace.projects.filter((project) => project.lead_outcome === "LOST").length;

  return {
    totalInquiries: workspace.inquiries.length,
    recentInquiries: recentInquiries.length,
    converted,
    conversionRate: workspace.inquiries.length ? Math.round((converted / workspace.inquiries.length) * 100) : 0,
    wonProjects,
    lostProjects,
    activeProjects: activeProjects.length,
    taskCompletion: workspace.tasks.length ? Math.round((doneTasks / workspace.tasks.length) * 100) : 0,
    overdueTasks: overdueTasks.length,
    pipeline: ["LEAD", "PLANNING", "ACTIVE", "REVIEW", "COMPLETED", "ON_HOLD"].map((status) => ({
      status,
      count: workspace.projects.filter((project) => project.status === status).length,
    })),
    workload: workspace.profiles.map((profile) => ({
      name: profile.full_name,
      openTasks: openTasks.filter((task) => task.assignee_id === profile.id).length,
      overdueTasks: overdueTasks.filter((task) => task.assignee_id === profile.id).length,
    })),
    overdue: overdueTasks,
  };
}
