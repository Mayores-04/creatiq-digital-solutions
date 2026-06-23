import type { AdminRole } from "./constants";

export type SelectOption = { value: string; label: string };

export type ProfileRecord = {
  id: string;
  full_name: string;
  email: string;
  role: AdminRole;
  job_title: string | null;
  is_active: boolean;
};

export type ClientRecord = {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
};

export type InquiryRecord = {
  id: string;
  name: string;
  email: string;
  services: string[];
  description: string;
  status: string;
  internal_notes: string | null;
  client_id: string | null;
  project_id: string | null;
  created_at: string;
};

export type ProjectRecord = {
  id: string;
  client_id: string | null;
  inquiry_id: string | null;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
};

export type TaskRecord = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: string;
  assignee_id: string | null;
  due_date: string | null;
  created_at: string;
};

export type ProjectDocumentRecord = {
  id: string;
  project_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  byte_size: number | null;
  uploaded_by: string | null;
  created_at: string;
};

export type ServiceRecord = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon_name: string;
  sort_order: number;
  is_published: boolean;
};

export type PortfolioRecord = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  image_url: string | null;
  image_public_id: string | null;
  project_url: string | null;
  technologies: string[];
  project_date: string | null;
  asset_size: string | null;
  source_image_path: string | null;
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
};

export type ActivityRecord = {
  id: string;
  actor_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
};

export type CompanySettingsRecord = {
  company_name: string;
  company_email: string;
  location: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  social_links: Record<string, string>;
};

export type AdminWorkspace = {
  identity: { id: string; role: AdminRole; fullName: string; email: string };
  profiles: ProfileRecord[];
  clients: ClientRecord[];
  inquiries: InquiryRecord[];
  projects: ProjectRecord[];
  projectMembers: { project_id: string; profile_id: string }[];
  tasks: TaskRecord[];
  documents: ProjectDocumentRecord[];
  services: ServiceRecord[];
  portfolio: PortfolioRecord[];
  activity: ActivityRecord[];
  settings: CompanySettingsRecord | null;
};
