export const ADMIN_ROLES = ["ADMIN", "STAFF"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const INQUIRY_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "CLOSED"] as const;
export const PROJECT_STATUSES = ["LEAD", "PLANNING", "ACTIVE", "REVIEW", "COMPLETED", "ON_HOLD"] as const;
export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;
export const PROJECT_TYPES = ["PERSONAL", "CLIENT", "TEAM"] as const;
export const LEAD_OUTCOMES = ["OPEN", "WON", "LOST"] as const;
export const REVIEW_STATUSES = ["REQUESTED", "PENDING", "APPROVED", "REJECTED"] as const;
export const CONTENT_STATUSES = ["IDEA", "DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"] as const;

export const ADMIN_MODULES = [
  { key: "overview", label: "Overview" },
  { key: "inquiries", label: "Inquiries" },
  { key: "clients", label: "Clients" },
  { key: "projects", label: "Projects" },
  { key: "tasks", label: "Tasks" },
  { key: "employees", label: "Employees" },
  { key: "customer-reviews", label: "Customer Reviews" },
  { key: "services", label: "Services" },
  { key: "reports", label: "Reports" },
  { key: "content-planner", label: "Content Planner" },
  { key: "facebook", label: "Facebook Page" },
  { key: "notifications", label: "Notifications" },
  { key: "activity", label: "Activity Center" },
  { key: "settings", label: "Company Settings" },
  { key: "users", label: "User Management" },
] as const;

export type AdminModuleKey = (typeof ADMIN_MODULES)[number]["key"];

export const DEFAULT_COMPANY_SETTINGS = {
  company_name: "Creatiq Digital Solutions",
  company_email: "creatiq.digitalsolutions@gmail.com",
  location: "Cainta, Rizal",
  logo_url: "/images/brand/creatiq-landscape.png",
  favicon_url: "/images/brand/creatiq-icon-dark.png",
  social_links: {} as Record<string, string>,
};
