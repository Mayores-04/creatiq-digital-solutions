import { BadgeCheck, Brush, Code2, PenTool, Share2, Smartphone, Video, type LucideIcon } from "lucide-react";

const services: { id: string; title: string; description: string; icon: LucideIcon; wide?: boolean }[] = [
  { id: "graphic-design", title: "Graphic Design", description: "Visual storytelling that captures attention and defines brand personality.", icon: Brush },
  { id: "web-custom-systems", title: "Web & Custom Systems", description: "High-performance websites and internal management systems built for scale.", icon: Code2, wide: true },
  { id: "social-media", title: "Social Media", description: "Digital strategy and content that drives real business growth.", icon: Share2 },
  { id: "branding-logo", title: "Branding & Logo", description: "Crafting iconic identities that resonate with your target audience.", icon: BadgeCheck },
  { id: "mobile-app", title: "Mobile App", description: "Intuitive mobile experiences designed for the palm of your hand.", icon: Smartphone },
  { id: "ui-ux-design", title: "UI/UX Design", description: "User-centered interfaces optimized for clarity, conversion, and delight.", icon: PenTool },
  { id: "video-editing", title: "Video Editing", description: "Professional video editing, motion graphics, and marketing visuals.", icon: Video },
];

export function ServicesSection() { return <section id="services" className="bg-surface-low/30 py-20 sm:py-24 lg:py-32"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 xl:px-16"><div className="mb-10 sm:mb-16"><h2 className="text-3xl font-bold text-primary md:text-4xl">Our Expertise</h2><div className="mt-4 h-1 w-24 rounded-full bg-secondary" /></div><div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">{services.map(({ id, title, description, icon: Icon, wide }) => <article id={id} key={title} className={`scroll-mt-24 glass-card rounded-2xl p-6 sm:p-8 ${wide ? "lg:col-span-2" : ""}`}><Icon className="mb-4 text-secondary" size={40} /><h3 className="text-xl font-bold text-foreground">{title}</h3><p className="mt-3 text-sm leading-6 text-muted">{description}</p></article>)}</div></div></section>; }
