import { AboutSection } from "@/components/site/about-section";
import { ContactSection } from "@/components/site/contact-section";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { HeroSection } from "@/components/site/hero-section";
import { PortfolioSection } from "@/components/site/portfolio-section";
import { ProcessSection } from "@/components/site/process-section";
import { ServicesSection } from "@/components/site/services-section";
import { SolutionsSection } from "@/components/site/solutions-section";
import { WhyChooseUsSection } from "@/components/site/why-choose-us-section";
import { getPublicSiteData } from "@/lib/crm/public-data";
import { ReviewsSection } from "@/components/site/reviews-section";

// Projects, reviews, settings, and public counters are maintained in the CRM.
// Render per request so a publish/edit is visible on the marketing site without
// needing another deployment.
export const dynamic = "force-dynamic";

export default async function Home() {
  const { settings, services, projects, reviews, stats } =
    await getPublicSiteData();
  return (
    <main className="relative min-h-screen overflow-x-clip">
      <Header settings={settings} />
      <HeroSection stats={stats} />
      <AboutSection />
      <ServicesSection services={services} />
      <SolutionsSection stats={stats} />
      <PortfolioSection projects={projects} />
      <ReviewsSection reviews={reviews} />
      <WhyChooseUsSection />
      <ProcessSection />
      <ContactSection settings={settings} services={services} />
      <Footer settings={settings} />
    </main>
  );
}
