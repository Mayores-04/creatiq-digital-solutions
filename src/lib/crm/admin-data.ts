import "server-only";

import { requireAdmin } from "./auth";
import type {
  ActivityRecord,
  AdminWorkspace,
  ClientRecord,
  CompanySettingsRecord,
  InquiryRecord,
  PortfolioRecord,
  ProfileRecord,
  ProjectRecord,
  ProjectDocumentRecord,
  ServiceRecord,
  TaskRecord,
} from "./types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type QueryResult<T> = { data: T | null; error: { message: string } | null };

function rows<T>(result: QueryResult<T[]>, label: string): T[] {
  if (result.error) throw new Error(`Unable to load ${label}: ${result.error.message}`);
  return result.data ?? [];
}

function row<T>(result: QueryResult<T>, label: string): T | null {
  if (result.error) throw new Error(`Unable to load ${label}: ${result.error.message}`);
  return result.data;
}

export async function getAdminWorkspace(): Promise<AdminWorkspace> {
  const identity = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const ownerOnly = identity.role === "OWNER";
  const [profilesResult, clientsResult, inquiriesResult, projectsResult, membersResult, tasksResult, documentsResult, servicesResult, portfolioResult, activityResult, settingsResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, role, job_title, is_active").order("full_name"),
    supabase.from("clients").select("id, company_name, contact_name, email, phone, notes, created_at").order("created_at", { ascending: false }),
    supabase.from("inquiries").select("id, name, email, services, description, status, internal_notes, client_id, project_id, created_at").order("created_at", { ascending: false }),
    supabase.from("projects").select("id, client_id, inquiry_id, name, description, status, progress, start_date, due_date, completed_at, created_at").order("created_at", { ascending: false }),
    supabase.from("project_members").select("project_id, profile_id"),
    supabase.from("tasks").select("id, project_id, title, description, status, assignee_id, due_date, created_at").order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("project_documents").select("id, project_id, file_name, storage_path, mime_type, byte_size, uploaded_by, created_at").order("created_at", { ascending: false }),
    ownerOnly
      ? supabase.from("services").select("id, slug, title, description, icon_name, sort_order, is_published").order("sort_order")
      : Promise.resolve({ data: [], error: null }),
    ownerOnly
      ? supabase.from("portfolio_projects").select("id, slug, title, category, summary, image_url, image_public_id, project_url, technologies, project_date, asset_size, source_image_path, is_published, is_featured, sort_order").order("sort_order")
      : Promise.resolve({ data: [], error: null }),
    supabase.from("activity_logs").select("id, actor_id, entity_type, entity_id, action, details, created_at").order("created_at", { ascending: false }).limit(80),
    ownerOnly
      ? supabase.from("company_settings").select("company_name, company_email, location, logo_url, favicon_url, social_links").eq("id", true).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  return {
    identity,
    profiles: rows(profilesResult as QueryResult<ProfileRecord[]>, "employees"),
    clients: rows(clientsResult as QueryResult<ClientRecord[]>, "clients"),
    inquiries: rows(inquiriesResult as QueryResult<InquiryRecord[]>, "inquiries").map((inquiry) => ({
      ...inquiry,
      services: Array.isArray(inquiry.services) ? inquiry.services : [],
    })),
    projects: rows(projectsResult as QueryResult<ProjectRecord[]>, "projects"),
    projectMembers: rows(membersResult as QueryResult<{ project_id: string; profile_id: string }[]>, "project assignments"),
    tasks: rows(tasksResult as QueryResult<TaskRecord[]>, "tasks"),
    documents: rows(documentsResult as QueryResult<ProjectDocumentRecord[]>, "project documents"),
    services: rows(servicesResult as QueryResult<ServiceRecord[]>, "services"),
    portfolio: rows(portfolioResult as QueryResult<PortfolioRecord[]>, "portfolio projects"),
    activity: rows(activityResult as QueryResult<ActivityRecord[]>, "activity"),
    settings: row(settingsResult as QueryResult<CompanySettingsRecord>, "company settings"),
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

  return {
    totalInquiries: workspace.inquiries.length,
    recentInquiries: recentInquiries.length,
    converted,
    conversionRate: workspace.inquiries.length ? Math.round((converted / workspace.inquiries.length) * 100) : 0,
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
