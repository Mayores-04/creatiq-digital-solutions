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

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-clip">
      <Header />
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <SolutionsSection />
      <PortfolioSection />
      <WhyChooseUsSection />
      <ProcessSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
