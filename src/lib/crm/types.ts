import type { AdminModuleKey, AdminRole } from "./constants";

export type SelectOption = { value: string; label: string };

export type ProfileRecord = {
  id: string;
  full_name: string;
  email: string;
  role: AdminRole;
  access_role_id: string | null;
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
  slug: string | null;
  service_id: string | null;
  service_ids: string[];
  service_titles: string[];
  client_id: string | null;
  inquiry_id: string | null;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  category: string | null;
  project_type: "PERSONAL" | "CLIENT" | "TEAM";
  lead_outcome: "OPEN" | "WON" | "LOST";
  lost_reason: string | null;
  is_published: boolean;
  is_featured: boolean;
  image_url: string | null;
  image_public_id: string | null;
  project_url: string | null;
  technologies: string[];
  project_date: string | null;
  asset_size: string | null;
  source_image_path: string | null;
  sort_order: number;
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

export type ProjectServiceRecord = {
  project_id: string;
  service_id: string;
};

export type ProjectContributorRecord = {
  id: string;
  project_id: string;
  profile_id: string | null;
  external_name: string | null;
  external_email: string | null;
  contribution_role: string | null;
};

export type CustomerReviewRecord = {
  id: string;
  request_token: string;
  client_id: string | null;
  project_id: string | null;
  recipient_email: string | null;
  recipient_name: string | null;
  customer_name: string | null;
  customer_email: string | null;
  rating: number | null;
  testimonial: string | null;
  status: "REQUESTED" | "PENDING" | "APPROVED" | "REJECTED";
  submitted_at: string | null;
  created_at: string;
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

export type AccessRoleRecord = {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  is_system: boolean;
  created_at: string;
};

export type ContentPlannerItemRecord = {
  id: string;
  title: string;
  channel: string;
  content_type: string;
  status: "IDEA" | "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  planned_for: string;
  description: string | null;
  owner_id: string | null;
  project_id: string | null;
  service_id: string | null;
  media_assets: ContentPlannerMediaAsset[];
  platform_targets: string[];
  automation_metadata: Record<string, unknown>;
  created_at: string;
};

export type ContentPlannerMediaAsset = {
  id: string;
  url: string;
  publicId: string | null;
  provider: "cloudinary" | "external";
  mimeType: string | null;
  fileName: string | null;
  alt: string | null;
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
  identity: { id: string; role: AdminRole; fullName: string; email: string; permissions: AdminModuleKey[] };
  profiles: ProfileRecord[];
  accessRoles: AccessRoleRecord[];
  clients: ClientRecord[];
  inquiries: InquiryRecord[];
  projects: ProjectRecord[];
  projectServices: ProjectServiceRecord[];
  projectMembers: { project_id: string; profile_id: string }[];
  contributors: ProjectContributorRecord[];
  tasks: TaskRecord[];
  documents: ProjectDocumentRecord[];
  services: ServiceRecord[];
  reviews: CustomerReviewRecord[];
  activity: ActivityRecord[];
  contentPlannerItems: ContentPlannerItemRecord[];
  settings: CompanySettingsRecord | null;
};
