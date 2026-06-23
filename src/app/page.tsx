import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  BadgeCheck,
  BrainCircuit,
  Brush,
  CalendarCheck,
  Code2,
  Gauge,
  Globe2,
  LayoutDashboard,
  Mail,
  MapPin,
  Menu,
  Package,
  PenTool,
  Share2,
  Smartphone,
  Sparkles,
  Video,
} from "lucide-react";
import { HeroBackground } from "@/components/hero-background";
// import { NavLogo } from "@/components/nav-logo";
import Image from "next/image";

const brand = {
  landscape: "/images/brand/creatiq-landscape.png",
  portrait: "/images/brand/creatiq-portrait.png",
  iconLight: "/images/brand/creatiq-icon-light.png",
  iconDark: "/images/brand/creatiq-icon-dark.png",
};

const services = [
  {
    title: "Graphic Design",
    description:
      "Visual storytelling that captures attention and defines brand personality.",
    icon: Brush,
  },
  {
    title: "Web & Custom Systems",
    description:
      "High-performance websites and internal management systems built for scale.",
    icon: Code2,
    wide: true,
  },
  {
    title: "Social Media",
    description:
      "Digital strategy and content that drives real business growth.",
    icon: Share2,
  },
  {
    title: "Branding & Logo",
    description:
      "Crafting iconic identities that resonate with your target audience.",
    icon: BadgeCheck,
  },
  {
    title: "Mobile App",
    description:
      "Intuitive mobile experiences designed for the palm of your hand.",
    icon: Smartphone,
  },
  {
    title: "UI/UX Design",
    description:
      "User-centered interfaces optimized for clarity, conversion, and delight.",
    icon: PenTool,
  },
  {
    title: "Video Editing",
    description:
      "Professional video editing, motion graphics, and marketing visuals.",
    icon: Video,
  },
];

const solutions = [
  {
    title: "Booking Systems",
    description: "Streamlined scheduling for service-based businesses.",
    icon: CalendarCheck,
  },
  {
    title: "Inventory Management",
    description:
      "Real-time tracking, stock visibility, and automated stock alerts.",
    icon: Package,
  },
  {
    title: "Custom Dashboards",
    description: "Data visualization for faster and smarter decision-making.",
    icon: LayoutDashboard,
  },
];

const projects = [
  {
    category: "Social Media",
    title: "Brand Campaign System",
    description:
      "Strategy, content design, and visual direction for online growth.",
  },
  {
    category: "Identity",
    title: "Tech Brand Rebrand",
    description: "Logo design, brand direction, and complete visual identity.",
  },
  {
    category: "Web Development",
    title: "Business Website Platform",
    description:
      "Modern website design with responsive and conversion-focused UI.",
  },
];

const reasons = [
  {
    title: "Professional Designs",
    description:
      "Every pixel is deliberate. We build modern visuals that make your brand look premium.",
    icon: BadgeCheck,
  },
  {
    title: "Fast Turnaround",
    description:
      "Our workflow is organized, practical, and focused on delivering visible progress.",
    icon: Gauge,
  },
  {
    title: "Creative Solutions",
    description:
      "We approach each project with strategy, creativity, and business-focused execution.",
    icon: BrainCircuit,
  },
];

const process = [
  {
    title: "Consultation",
    description: "We listen to your goals, business needs, and project vision.",
  },
  {
    title: "Planning & Design",
    description: "We create the direction, structure, and visual concept.",
  },
  {
    title: "Development",
    description: "We turn the approved design into a working digital product.",
  },
  {
    title: "Launch",
    description: "We finalize, optimize, and prepare your project for release.",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen">
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

function Header() {
  return (
    <header className="fixed left-0 top-0 z-50 h-20 w-full border-b border-cyan-300/20 bg-surface/80 shadow-[0_0_20px_rgba(0,186,252,0.15)] backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-5 md:px-8 lg:px-16">
        <a href="#home" className="flex items-center">
          <Image
            src={brand.landscape}
            alt="Creatiq Digital Solutions"
            width={260}
            height={90}
            priority
            className="h-12 w-auto object-contain md:h-14"
          />
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#services"
            className="border-b-2 border-secondary pb-1 text-xs font-semibold uppercase tracking-[0.2em] text-secondary"
          >
            Services
          </a>
          <a
            href="#portfolio"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-muted transition hover:text-secondary"
          >
            Portfolio
          </a>
          <a
            href="#process"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-muted transition hover:text-secondary"
          >
            Process
          </a>
          <a
            href="#about"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-muted transition hover:text-secondary"
          >
            About
          </a>
        </nav>

        <a
          href="#contact"
          className="primary-btn hidden rounded-lg px-6 py-3 text-xs font-bold uppercase tracking-widest text-white md:inline-flex"
        >
          Get a Free Quote
        </a>

        <button className="inline-flex rounded-lg border border-cyan-300/20 p-2 text-secondary md:hidden">
          <Menu size={22} />
        </button>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center overflow-hidden pt-20"
    >
      <HeroBackground />

      <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_20%_20%,rgba(8,189,255,0.18),transparent_28rem),linear-gradient(180deg,rgba(2,11,31,0.15),#020b1f_92%)]" />

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl grid-cols-1 items-center gap-10 px-5 py-12 md:px-8 lg:grid-cols-2 lg:px-16">
        <div className="max-w-xl space-y-6">
          <div className="animate-fade-in-up inline-flex items-center gap-2.5 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3.5 py-1.5 shadow-[0_0_24px_rgba(8,189,255,0.12)] backdrop-blur-md">
            <Image
              src={brand.iconDark}
              alt="Creatiq icon"
              width={24}
              height={24}
              priority
              className="h-6 w-6 object-contain"
            />
            <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-secondary">
              Creatiq Digital Solutions
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="animate-fade-in-up delay-100 text-4xl font-black leading-[1.05] tracking-[-0.05em] text-primary sm:text-5xl lg:text-[64px]">
              Create digital products that make your brand{" "}
              <span className="hero-gradient-text">stand out.</span>
            </h1>

            <p className="animate-fade-in-up delay-200 max-w-lg text-sm leading-7 text-muted md:text-[15px]">
              We design and develop modern websites, custom systems, mobile
              apps, branding materials, graphics, and marketing creatives built
              for real business growth.
            </p>
          </div>

          <div className="animate-fade-in-up delay-200 flex flex-col gap-3 sm:flex-row">
            <a
              href="#contact"
              className="primary-btn rounded-xl px-6 py-3.5 text-center text-[11px] font-bold uppercase tracking-widest text-white shadow-lg"
            >
              Start Your Project
            </a>

            <a
              href="#portfolio"
              className="rounded-xl border border-cyan-300/40 bg-white/[0.02] px-6 py-3.5 text-center text-[11px] font-bold uppercase tracking-widest text-secondary backdrop-blur-md transition hover:bg-cyan-300/10"
            >
              View Portfolio
            </a>
          </div>

          <div className="animate-fade-in-up delay-200 grid max-w-lg grid-cols-3 gap-3 pt-2">
            <div className="rounded-2xl border border-cyan-300/15 bg-white/[0.03] p-3.5 backdrop-blur-md">
              <p className="text-xl font-black text-secondary">Web</p>
              <p className="mt-1 text-[10px] leading-4 text-muted">
                Websites & systems
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-300/15 bg-white/[0.03] p-3.5 backdrop-blur-md">
              <p className="text-xl font-black text-secondary">UI</p>
              <p className="mt-1 text-[10px] leading-4 text-muted">
                Clean interfaces
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-300/15 bg-white/[0.03] p-3.5 backdrop-blur-md">
              <p className="text-xl font-black text-secondary">Brand</p>
              <p className="mt-1 text-[10px] leading-4 text-muted">
                Digital identity
              </p>
            </div>
          </div>
        </div>

        <HeroShowcase />
      </div>
    </section>
  );
}
function HeroShowcase() {
  return (
    <div className="relative hidden min-h-[500px] items-center justify-center lg:flex">
      <div className="absolute h-[440px] w-[440px] rounded-full bg-cyan-400/10 blur-[80px]" />
      <div className="absolute right-8 top-12 h-32 w-32 rounded-full bg-blue-600/20 blur-[60px]" />
      <div className="absolute bottom-16 left-8 h-28 w-28 rounded-full bg-cyan-300/20 blur-[50px]" />

      <div className="floating relative w-full max-w-[455px]">
        <div className="glass-card relative z-10 rounded-[1.75rem] p-4 shadow-[0_0_60px_rgba(8,189,255,0.16)]">
          <div className="tech-grid overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#061a3a]/90">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Image
                  src={brand.iconDark}
                  alt="Creatiq icon"
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-secondary">
                    Creatiq Studio
                  </p>
                  <p className="text-xs font-bold text-primary">
                    Business Dashboard
                  </p>
                </div>
              </div>

              <Sparkles className="text-secondary" size={18} />
            </div>

            <div className="grid gap-3 p-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-cyan-300/10 p-3">
                  <p className="text-[9px] uppercase tracking-widest text-muted">
                    Projects
                  </p>
                  <p className="mt-1.5 text-2xl font-black text-secondary">
                    18
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-500/20 p-3">
                  <p className="text-[9px] uppercase tracking-widest text-muted">
                    Leads
                  </p>
                  <p className="mt-1.5 text-2xl font-black text-primary">42</p>
                </div>

                <div className="rounded-2xl bg-indigo-300/10 p-3">
                  <p className="text-[9px] uppercase tracking-widest text-muted">
                    Growth
                  </p>
                  <p className="mt-1.5 text-2xl font-black text-secondary">
                    96%
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-background/50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-bold text-primary">
                    Creative Performance
                  </p>
                  <span className="rounded-full bg-cyan-300/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-secondary">
                    Live
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="h-2.5 w-full rounded-full bg-white/10">
                    <div className="h-2.5 w-[86%] rounded-full bg-gradient-to-r from-blue-600 to-cyan-300" />
                  </div>

                  <div className="h-2.5 w-full rounded-full bg-white/10">
                    <div className="h-2.5 w-[72%] rounded-full bg-gradient-to-r from-blue-600 to-cyan-300" />
                  </div>

                  <div className="h-2.5 w-full rounded-full bg-white/10">
                    <div className="h-2.5 w-[94%] rounded-full bg-gradient-to-r from-blue-600 to-cyan-300" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <Code2 className="mb-3 text-secondary" size={22} />
                  <p className="text-sm font-bold text-primary">Web Systems</p>
                  <p className="mt-1.5 text-[11px] leading-5 text-muted">
                    Fast, responsive, and scalable platforms.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <Smartphone className="mb-3 text-secondary" size={22} />
                  <p className="text-sm font-bold text-primary">Mobile Apps</p>
                  <p className="mt-1.5 text-[11px] leading-5 text-muted">
                    Smooth interfaces for modern users.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card absolute -bottom-6 -left-5 z-20 w-44 rounded-2xl p-3 shadow-2xl">
          <Image
            src={brand.landscape}
            alt="Creatiq Digital Solutions"
            width={220}
            height={80}
            className="h-auto w-full object-contain"
          />
        </div>

        <div className="glass-card absolute -right-5 top-16 z-20 w-36 rounded-[1.5rem] p-3 shadow-2xl">
          <div className="rounded-[1.2rem] border border-white/10 bg-background p-3">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

            <Image
              src={brand.iconDark}
              alt="Creatiq icon"
              width={76}
              height={76}
              className="mx-auto h-16 w-16 object-contain"
            />

            <div className="mt-4 space-y-2.5">
              <div className="h-2.5 rounded-full bg-cyan-300/30" />
              <div className="h-2.5 w-2/3 rounded-full bg-cyan-300/20" />
              <div className="h-8 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AboutSection() {
  return (
    <section id="about" className="relative py-28 md:py-32">
      <div className="mx-auto max-w-7xl px-5 text-center md:px-8 lg:px-16">
        <h2 className="text-3xl font-bold text-primary md:text-4xl">
          About Creatiq
        </h2>

        <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-muted md:text-lg">
          At Creatiq Digital Solutions, we turn ideas into impactful digital
          experiences. We bridge the gap between imagination and execution
          through clean design, reliable development, and business-focused
          digital solutions.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {["Create.", "Innovate.", "Elevate."].map((word) => (
            <div key={word} className="group text-center">
              <span className="text-4xl font-extrabold text-secondary transition-all group-hover:cyan-glow md:text-6xl">
                {word}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-20 h-1 w-full max-w-md bg-gradient-to-r from-transparent via-secondary to-transparent blur-[1px]" />
    </section>
  );
}

function ServicesSection() {
  return (
    <section id="services" className="bg-surface-low/30 py-28 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8 lg:px-16">
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-primary md:text-4xl">
            Our Expertise
          </h2>
          <div className="mt-4 h-1 w-24 rounded-full bg-secondary" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <div
                key={service.title}
                className={`glass-card rounded-2xl p-8 ${
                  service.wide ? "lg:col-span-2" : ""
                }`}
              >
                <Icon className="mb-4 text-secondary" size={42} />
                <h3 className="text-xl font-bold text-foreground">
                  {service.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SolutionsSection() {
  return (
    <section className="relative overflow-hidden py-28 md:py-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-5 md:px-8 lg:grid-cols-2 lg:gap-20 lg:px-16">
        <div className="relative order-2 lg:order-1">
          <div className="absolute -inset-10 rounded-full bg-secondary/10 blur-[100px]" />

          <div className="glass-card tech-grid relative z-10 rounded-3xl p-6 shadow-[0_0_50px_rgba(8,189,255,0.2)]">
            <div className="rounded-2xl border border-white/10 bg-[#061a3a]/80 p-6">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-secondary">
                    Enterprise Suite
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-primary">
                    Business Control Center
                  </h3>
                </div>
                <LayoutDashboard className="text-secondary" size={32} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-cyan-300/10 p-5">
                  <p className="text-sm text-muted">Projects</p>
                  <p className="mt-2 text-3xl font-bold text-secondary">24</p>
                </div>
                <div className="rounded-2xl bg-blue-500/20 p-5">
                  <p className="text-sm text-muted">Requests</p>
                  <p className="mt-2 text-3xl font-bold text-primary">138</p>
                </div>
                <div className="rounded-2xl bg-indigo-300/10 p-5 sm:col-span-2">
                  <div className="mb-4 h-3 w-4/5 rounded-full bg-cyan-300/30" />
                  <div className="h-3 w-3/5 rounded-full bg-cyan-300/20" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="order-1 space-y-8 lg:order-2">
          <h2 className="text-3xl font-bold text-primary md:text-4xl">
            Advanced Enterprise Solutions
          </h2>

          <p className="text-lg leading-8 text-muted">
            We specialize in building custom digital systems that simplify
            business operations, improve workflow, and make daily processes more
            efficient.
          </p>

          <ul className="space-y-6">
            {solutions.map((solution) => {
              const Icon = solution.icon;

              return (
                <li key={solution.title} className="flex items-start gap-4">
                  <span className="rounded-lg bg-cyan-300/10 p-2 text-secondary">
                    <Icon size={24} />
                  </span>

                  <div>
                    <h4 className="text-lg font-bold text-foreground">
                      {solution.title}
                    </h4>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      {solution.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

function PortfolioSection() {
  return (
    <section id="portfolio" className="bg-background py-28 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8 lg:px-16">
        <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h2 className="text-3xl font-bold text-primary md:text-4xl">
              Our Work
            </h2>
            <p className="mt-2 text-muted">
              A glimpse into the digital solutions we build.
            </p>
          </div>

          <div className="flex gap-4">
            <button className="rounded-full border border-white/10 p-2 text-muted transition hover:border-secondary hover:text-secondary">
              <ArrowLeft size={22} />
            </button>
            <button className="rounded-full border border-white/10 p-2 text-muted transition hover:border-secondary hover:text-secondary">
              <ArrowRight size={22} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <div
              key={project.title}
              className="glass-card group relative aspect-[4/5] overflow-hidden rounded-2xl border-none"
            >
              <div
                className={`absolute inset-0 transition duration-700 group-hover:scale-110 ${
                  index === 0
                    ? "bg-[radial-gradient(circle_at_top,#08bdff,transparent_36%),linear-gradient(135deg,#061a3a,#1b0f44)]"
                    : index === 1
                      ? "bg-[radial-gradient(circle_at_top,#bac3ff,transparent_36%),linear-gradient(135deg,#061a3a,#081327)]"
                      : "bg-[radial-gradient(circle_at_top,#86d2ff,transparent_36%),linear-gradient(135deg,#081327,#101d3a)]"
                }`}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-90" />

              <div className="absolute bottom-0 left-0 w-full p-8">
                <span className="rounded bg-cyan-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-secondary">
                  {project.category}
                </span>

                <h4 className="mt-2 text-xl font-bold text-foreground">
                  {project.title}
                </h4>

                <p className="mt-2 text-sm leading-6 text-muted opacity-0 transition duration-300 group-hover:opacity-100">
                  {project.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyChooseUsSection() {
  return (
    <section className="relative py-28 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8 lg:px-16">
        <div className="mb-20 text-center">
          <h2 className="text-3xl font-bold text-primary md:text-4xl">
            Why Creatiq?
          </h2>
          <p className="mt-2 text-muted">
            We don&apos;t just build, we engineer digital excellence.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {reasons.map((reason) => {
            const Icon = reason.icon;

            return (
              <div
                key={reason.title}
                className="glass-card group rounded-3xl p-10 text-center"
              >
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-300/10 text-secondary transition group-hover:bg-cyan-300/20">
                  <Icon size={32} />
                </div>

                <h4 className="mb-4 text-xl font-bold">{reason.title}</h4>
                <p className="text-sm leading-6 text-muted">
                  {reason.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  return (
    <section
      id="process"
      className="overflow-hidden bg-surface-low/20 py-28 md:py-32"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-8 lg:px-16">
        <div className="mb-20 text-center">
          <h2 className="text-3xl font-bold text-primary md:text-4xl">
            How We Work
          </h2>
        </div>

        <div className="relative">
          <div className="absolute left-0 top-6 hidden h-px w-full bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent lg:block" />

          <div className="relative z-10 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {process.map((step, index) => (
              <div
                key={step.title}
                className="flex flex-col items-center text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-secondary bg-background font-bold text-secondary shadow-[0_0_15px_rgba(8,189,255,0.4)]">
                  {index + 1}
                </div>

                <h5 className="mt-6 text-lg font-bold">{step.title}</h5>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="relative overflow-hidden py-28 md:py-32">
      <div className="absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-[120px]" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-blue-600/10 blur-[90px]" />

      <div className="relative z-10 mx-auto max-w-6xl px-5 md:px-8 lg:px-16">
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-secondary backdrop-blur-md">
            <Sparkles size={14} />
            Start a Project
          </div>

          <h2 className="text-3xl font-black tracking-[-0.04em] text-primary md:text-5xl">
            Let&apos;s build something creative.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted md:text-base">
            Tell us what you need and we&apos;ll help you plan the best digital
            solution for your business, brand, or project.
          </p>
        </div>

        <div className="glass-card mx-auto grid max-w-5xl grid-cols-1 overflow-hidden rounded-[2rem] border-cyan-300/20 shadow-[0_0_70px_rgba(8,189,255,0.12)] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-[#061a3a] p-8 md:p-10">
            <div className="absolute -left-16 -top-16 h-44 w-44 rounded-full bg-cyan-300/20 blur-[70px]" />
            <div className="absolute -bottom-20 right-0 h-56 w-56 rounded-full bg-cyan-300/10 blur-[80px]" />

            <div className="relative flex h-full min-h-[420px] flex-col justify-between">
              <div>
                <div className="mb-8 flex items-center gap-3">
                  <Image
                    src={brand.iconDark}
                    alt="Creatiq icon"
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-2xl object-contain shadow-[0_0_30px_rgba(8,189,255,0.25)]"
                  />

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-200">
                      Creatiq
                    </p>
                    <p className="text-sm font-semibold text-white/80">
                      Digital Solutions
                    </p>
                  </div>
                </div>

                <h3 className="max-w-sm text-3xl font-black leading-tight tracking-[-0.04em] text-white md:text-4xl">
                  Ready to turn your idea into a real digital product?
                </h3>

                <p className="mt-5 max-w-sm text-sm leading-7 text-cyan-50/80">
                  From websites and systems to branding and marketing creatives,
                  we&apos;ll help you create something clean, modern, and
                  useful.
                </p>
              </div>

              <div className="space-y-4">
                <a
                  href="mailto:jakemayores05@gmail.com"
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white/90 backdrop-blur-md transition hover:bg-white/15"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-cyan-200">
                    <Mail size={18} />
                  </span>
                  <span>jakemayores05@gmail.com</span>
                </a>

                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white/90 backdrop-blur-md">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-cyan-200">
                    <MapPin size={18} />
                  </span>
                  <span>Cainta, Rizal</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#07152d]/80 p-8 md:p-10">
            <form className="space-y-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="h-13 w-full rounded-2xl border border-cyan-300/15 bg-background/70 px-4 text-sm text-primary outline-none transition placeholder:text-muted/55 focus:border-secondary focus:bg-background focus:shadow-[0_0_0_4px_rgba(8,189,255,0.08)]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className="h-13 w-full rounded-2xl border border-cyan-300/15 bg-background/70 px-4 text-sm text-primary outline-none transition placeholder:text-muted/55 focus:border-secondary focus:bg-background focus:shadow-[0_0_0_4px_rgba(8,189,255,0.08)]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
                  Service Needed
                </label>
                <select className="h-13 w-full rounded-2xl border border-cyan-300/15 bg-background/70 px-4 text-sm text-primary outline-none transition focus:border-secondary focus:bg-background focus:shadow-[0_0_0_4px_rgba(8,189,255,0.08)]">
                  <option>Web Development</option>
                  <option>Custom Web-Based System</option>
                  <option>Mobile App Development</option>
                  <option>UI/UX Design</option>
                  <option>Branding & Logo Design</option>
                  <option>Graphic Design</option>
                  <option>Social Media Creatives</option>
                  <option>Digital Marketing Materials</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
                  Project Description
                </label>
                <textarea
                  placeholder="Tell us about your project..."
                  className="min-h-[150px] w-full resize-none rounded-2xl border border-cyan-300/15 bg-background/70 px-4 py-4 text-sm text-primary outline-none transition placeholder:text-muted/55 focus:border-secondary focus:bg-background focus:shadow-[0_0_0_4px_rgba(8,189,255,0.08)]"
                />
              </div>

              <button
                type="submit"
                className="primary-btn flex h-14 w-full items-center justify-center rounded-2xl text-xs font-black uppercase tracking-[0.22em] text-white shadow-[0_0_30px_rgba(8,189,255,0.18)]"
              >
                Send Inquiry
              </button>

              <p className="text-center text-xs leading-6 text-muted/70">
                We&apos;ll review your inquiry and reply as soon as possible.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-background py-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 md:grid-cols-4 md:px-8 lg:px-16">
        <div className="space-y-4">
          <Image
            src={brand.landscape}
            alt="Creatiq Digital Solutions"
            width={280}
            height={100}
            className="h-16 w-auto object-contain"
          />
          <p className="max-w-xs text-sm leading-6 text-muted">
            Engineering the future of digital presence through visionary design
            and high-performance technology.
          </p>

          <div className="flex gap-4 text-muted">
            <Globe2 className="transition hover:text-secondary" size={20} />
            <AtSign className="transition hover:text-secondary" size={20} />
            <Share2 className="transition hover:text-secondary" size={20} />
          </div>
        </div>

        <FooterColumn
          title="Company"
          links={["About Us", "Our Portfolio", "The Process", "Careers"]}
        />
        <FooterColumn
          title="Solutions"
          links={[
            "Graphic Design",
            "Web Systems",
            "Social Strategy",
            "App Development",
          ]}
        />
        <FooterColumn
          title="Legal"
          links={[
            "Privacy Policy",
            "Terms of Service",
            "Cookie Settings",
            "Contact Support",
          ]}
        />
      </div>

      <div className="mx-auto mt-16 max-w-7xl border-t border-white/10 px-5 pt-8 text-center text-xs text-muted/70 md:px-8 lg:px-16">
        © 2026 Creatiq Digital Solutions. Engineered for the future.
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div className="space-y-4">
      <h5 className="text-sm font-bold uppercase tracking-widest text-secondary">
        {title}
      </h5>

      <ul className="space-y-2 text-sm text-muted">
        {links.map((link) => (
          <li key={link}>
            <a href="#" className="transition hover:text-secondary">
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
