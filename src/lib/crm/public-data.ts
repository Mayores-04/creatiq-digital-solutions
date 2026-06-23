import "server-only";

import { createClient } from "@supabase/supabase-js";
import { DEFAULT_COMPANY_SETTINGS } from "./constants";
import { hasSupabaseConfig, getSupabaseConfig } from "@/lib/supabase/config";

export type PublicService = { slug: string; title: string; description: string; icon_name: string };
export type PublicPortfolioProject = { slug: string; category: string; title: string; summary: string; image_url: string | null; project_url: string | null; technologies: string[]; project_date: string | null };
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

const fallbackPortfolio: PublicPortfolioProject[] = [
  { slug: "brand-campaign-system", category: "Social Media", title: "Brand Campaign System", summary: "Strategy, content design, and visual direction for online growth.", image_url: null, project_url: null, technologies: [], project_date: null },
  { slug: "tech-brand-rebrand", category: "Identity", title: "Tech Brand Rebrand", summary: "Logo design, brand direction, and complete visual identity.", image_url: null, project_url: null, technologies: [], project_date: null },
  { slug: "business-website-platform", category: "Web Development", title: "Business Website Platform", summary: "Modern website design with responsive and conversion-focused UI.", image_url: null, project_url: null, technologies: [], project_date: null },
];

export async function getPublicSiteData() {
  if (!hasSupabaseConfig()) return { settings: DEFAULT_COMPANY_SETTINGS, services: fallbackServices, portfolio: fallbackPortfolio };

  try {
    const { url, publishableKey } = getSupabaseConfig();
    const supabase = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const [settingsResult, servicesResult, portfolioResult] = await Promise.all([
      supabase.from("company_settings").select("company_name, company_email, location, logo_url, favicon_url, social_links").eq("id", true).maybeSingle(),
      supabase.from("services").select("slug, title, description, icon_name").eq("is_published", true).order("sort_order"),
      supabase.from("portfolio_projects").select("slug, category, title, summary, image_url, project_url, technologies, project_date").eq("is_published", true).order("sort_order"),
    ]);

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
      portfolio: portfolioResult.data?.length ? portfolioResult.data as PublicPortfolioProject[] : fallbackPortfolio,
    };
  } catch (error) {
    console.error("Unable to load public CMS data:", error);
    return { settings: DEFAULT_COMPANY_SETTINGS, services: fallbackServices, portfolio: fallbackPortfolio };
  }
}
