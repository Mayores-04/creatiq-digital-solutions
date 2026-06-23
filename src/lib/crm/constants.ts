export const ADMIN_ROLES = ["OWNER", "STAFF"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const INQUIRY_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "CLOSED"] as const;
export const PROJECT_STATUSES = ["LEAD", "PLANNING", "ACTIVE", "REVIEW", "COMPLETED", "ON_HOLD"] as const;
export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;

export const DEFAULT_COMPANY_SETTINGS = {
  company_name: "Creatiq Digital Solutions",
  company_email: "creatiq.digitalsolutions@gmail.com",
  location: "Cainta, Rizal",
  logo_url: "/images/brand/creatiq-landscape.png",
  favicon_url: "/images/brand/creatiq-icon-dark.png",
  social_links: {} as Record<string, string>,
};
