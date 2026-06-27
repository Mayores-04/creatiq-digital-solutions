import "server-only";

import { createClient } from "@supabase/supabase-js";
import { DEFAULT_COMPANY_SETTINGS } from "./constants";
import { hasSupabaseConfig, getSupabaseConfig } from "@/lib/supabase/config";
import { fetchWithSupabaseTimeout } from "@/lib/supabase/request";

export type PublicService = { slug: string; title: string; description: string; icon_name: string };
export type PublicProject = { slug: string; category: string; service_slugs: string[]; service_titles: string[]; title: string; summary: string; image_url: string | null; project_url: string | null; technologies: string[]; project_date: string | null; project_type: string };
export type PublicReview = { customer_name: string; rating: number; testimonial: string; project_name: string | null };
export type PublicCompanySettings = {
  company_name: string;
  company_email: string;
  location: string;
  logo_url: string;
  favicon_url: string;
  social_links: Record<string, string>;
};

const fallbackServices: PublicService[] = [
  { slug: "graphic-design", title: "Graphic Design", description: "Visual storytelling that captures attention and defines brand personality.", icon_name: "Brush" },
  { slug: "web-custom-systems", title: "Web & Custom Systems", description: "High-performance websites and internal management systems built for scale.", icon_name: "Code2" },
  { slug: "social-media", title: "Social Media", description: "Digital strategy and content that drives real business growth.", icon_name: "Share2" },
  { slug: "branding-logo", title: "Branding & Logo", description: "Crafting iconic identities that resonate with your target audience.", icon_name: "BadgeCheck" },
  { slug: "mobile-app", title: "Mobile App", description: "Intuitive mobile experiences designed for the palm of your hand.", icon_name: "Smartphone" },
  { slug: "ui-ux-design", title: "UI/UX Design", description: "User-centered interfaces optimized for clarity, conversion, and delight.", icon_name: "PenTool" },
  { slug: "video-editing", title: "Video Editing", description: "Professional video editing, motion graphics, and marketing visuals.", icon_name: "Video" },
];

const fallbackProjects: PublicProject[] = [
  { slug: "brand-campaign-system", category: "Social Media", service_slugs: ["social-media"], service_titles: ["Social Media"], title: "Brand Campaign System", summary: "Strategy, content design, and visual direction for online growth.", image_url: null, project_url: null, technologies: [], project_date: null, project_type: "CLIENT" },
  { slug: "tech-brand-rebrand", category: "Branding & Logo", service_slugs: ["branding-logo"], service_titles: ["Branding & Logo"], title: "Tech Brand Rebrand", summary: "Logo design, brand direction, and complete visual identity.", image_url: null, project_url: null, technologies: [], project_date: null, project_type: "CLIENT" },
  { slug: "business-website-platform", category: "Web & Custom Systems", service_slugs: ["web-custom-systems"], service_titles: ["Web & Custom Systems"], title: "Business Website Platform", summary: "Modern website design with responsive and conversion-focused UI.", image_url: null, project_url: null, technologies: [], project_date: null, project_type: "CLIENT" },
];

const fallbackSiteData = { settings: DEFAULT_COMPANY_SETTINGS, services: fallbackServices, projects: fallbackProjects, reviews: [] as PublicReview[], stats: { projects: fallbackProjects.length, active: 0, won: 0, inquiries: 0 } };
let unavailableUntil = 0;

export async function getPublicSiteData() {
  if (!hasSupabaseConfig() || Date.now() < unavailableUntil) return fallbackSiteData;

  try {
    const { url, publishableKey } = getSupabaseConfig();
    const supabase = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: fetchWithSupabaseTimeout } });
    const [settingsResult, servicesResult, projectsResult, reviewsResult, projectCountResult, activeCountResult, wonCountResult, inquiriesCountResult] = await Promise.all([
      supabase.from("company_settings").select("company_name, company_email, location, logo_url, favicon_url, social_links").eq("id", true).maybeSingle(),
      supabase.from("services").select("slug, title, description, icon_name").eq("is_published", true).order("sort_order"),
      supabase.from("projects").select("slug, category, name, description, image_url, project_url, technologies, project_date, project_type, primary_service:services!projects_service_id_fkey(slug, title), project_services(services!project_services_service_id_fkey(slug, title))").eq("is_published", true).order("sort_order"),
      supabase.from("customer_reviews").select("customer_name, rating, testimonial, projects(name)").eq("status", "APPROVED").order("published_at", { ascending: false }),
      supabase.from("projects").select("id", { count: "exact", head: true }).eq("is_published", true),
      supabase.from("projects").select("id", { count: "exact", head: true }).in("status", ["ACTIVE", "REVIEW"]),
      supabase.from("projects").select("id", { count: "exact", head: true }).eq("lead_outcome", "WON"),
      supabase.from("inquiries").select("id", { count: "exact", head: true }),
    ]);

    if (
      settingsResult.error ||
      servicesResult.error ||
      projectsResult.error ||
      reviewsResult.error ||
      projectCountResult.error ||
      activeCountResult.error ||
      wonCountResult.error ||
      inquiriesCountResult.error
    ) {
      throw new Error("The public CMS query could not reach Supabase.");
    }

    const setting = settingsResult.data;
    return {
      settings: setting ? {
        company_name: setting.company_name,
        company_email: setting.company_email,
        location: setting.location ?? DEFAULT_COMPANY_SETTINGS.location,
        logo_url: setting.logo_url ?? DEFAULT_COMPANY_SETTINGS.logo_url,
        favicon_url: setting.favicon_url ?? DEFAULT_COMPANY_SETTINGS.favicon_url,
        social_links: (setting.social_links ?? {}) as Record<string, string>,
      } : DEFAULT_COMPANY_SETTINGS,
      services: servicesResult.data?.length ? servicesResult.data as PublicService[] : fallbackServices,
      projects: projectsResult.data?.length ? projectsResult.data.map((project) => {
        const directServices = normalizeServices(project.primary_service);
        const linkedServices = Array.isArray(project.project_services)
          ? project.project_services.flatMap((link) => normalizeServices(link.services))
          : [];
        const services = linkedServices.length ? linkedServices : directServices;
        const serviceTitles = unique(services.map((service) => service.title).filter(Boolean));
        const serviceSlugs = unique(services.map((service) => service.slug).filter(Boolean));

        return {
          slug: project.slug ?? project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
          category: serviceTitles[0] ?? project.category ?? project.project_type,
          service_slugs: serviceSlugs,
          service_titles: serviceTitles,
          title: project.name,
          summary: project.description ?? "A Creatiq project.",
          image_url: project.image_url,
          project_url: project.project_url,
          technologies: Array.isArray(project.technologies) ? project.technologies : [],
          project_date: project.project_date,
          project_type: project.project_type,
        };
      }) as PublicProject[] : fallbackProjects,
      reviews: reviewsResult.data?.flatMap((review) => review.customer_name && review.rating && review.testimonial ? [{ customer_name: review.customer_name, rating: review.rating, testimonial: review.testimonial, project_name: Array.isArray(review.projects) ? review.projects[0]?.name ?? null : (review.projects as { name?: string } | null)?.name ?? null }] : []) as PublicReview[] ?? [],
      stats: { projects: projectCountResult.count ?? 0, active: activeCountResult.count ?? 0, won: wonCountResult.count ?? 0, inquiries: inquiriesCountResult.count ?? 0 },
    };
  } catch {
    unavailableUntil = Date.now() + 30_000;
    console.warn("Public CMS is temporarily unavailable; using local fallback content.");
    return fallbackSiteData;
  }
}

function normalizeServices(value: unknown) {
  const services = Array.isArray(value) ? value : value ? [value] : [];
  return services.flatMap((service) => {
    if (!service || typeof service !== "object") return [];
    const item = service as { slug?: unknown; title?: unknown };
    return [{
      slug: typeof item.slug === "string" ? item.slug : "",
      title: typeof item.title === "string" ? item.title : "",
    }];
  });
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
