import Image from "next/image";
import { Code2, Smartphone, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { HeroBackground } from "@/components/hero-background";
import { brand } from "./brand";

const highlights = [
  ["Web", "Websites & systems"],
  ["UI", "Clean interfaces"],
  ["Brand", "Digital identity"],
];

export function HeroSection() {
  return (
    <section id="home" className="relative flex min-h-[44rem] items-center overflow-hidden pt-16 lg:min-h-screen lg:pt-20">
      <HeroBackground />
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_20%_20%,rgba(8,189,255,0.18),transparent_28rem),linear-gradient(180deg,rgba(2,11,31,0.15),#020b1f_92%)]" />
      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:min-h-[calc(100vh-5rem)] lg:grid-cols-2 lg:gap-14 lg:px-10 xl:px-16">
        <div className="max-w-xl space-y-6">
          <div className="animate-fade-in-up inline-flex max-w-full items-center gap-2.5 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3.5 py-1.5 shadow-[0_0_24px_rgba(8,189,255,0.12)] backdrop-blur-md">
            <Image src={brand.icon} alt="" width={24} height={24} priority className="h-6 w-6 shrink-0 object-contain" />
            <span className="truncate text-[9px] font-bold uppercase tracking-[0.18em] text-secondary sm:tracking-[0.22em]">Creatiq Digital Solutions</span>
          </div>
          <div className="space-y-4">
            <h1 className="animate-fade-in-up delay-100 text-[2.35rem] font-black leading-[1.05] tracking-[-0.05em] text-primary sm:text-5xl lg:text-[clamp(3.5rem,5vw,4rem)]">
              Create digital products that make your brand <span className="hero-gradient-text">stand out.</span>
            </h1>
            <p className="animate-fade-in-up delay-200 max-w-lg text-sm leading-7 text-muted sm:text-[15px]">
              We design and develop modern websites, custom systems, mobile apps, branding materials, graphics, and marketing creatives built for real business growth.
            </p>
          </div>
          <div className="animate-fade-in-up delay-200 grid gap-3 sm:flex">
            <a href="#contact" className="primary-btn rounded-xl px-6 py-3.5 text-center text-[11px] font-bold uppercase tracking-widest text-white shadow-lg">Start Your Project</a>
            <a href="#portfolio" className="rounded-xl border border-cyan-300/40 bg-white/[0.02] px-6 py-3.5 text-center text-[11px] font-bold uppercase tracking-widest text-secondary backdrop-blur-md transition hover:bg-cyan-300/10">View Portfolio</a>
          </div>
          <div className="animate-fade-in-up delay-200 grid grid-cols-3 gap-2 pt-2 sm:gap-3">
            {highlights.map(([title, description]) => <div key={title} className="min-w-0 rounded-2xl border border-cyan-300/15 bg-white/[0.03] p-3 backdrop-blur-md sm:p-3.5"><p className="text-lg font-black text-secondary sm:text-xl">{title}</p><p className="mt-1 text-[9px] leading-4 text-muted sm:text-[10px]">{description}</p></div>)}
          </div>
        </div>
        <HeroShowcase />
      </div>
    </section>
  );
}

function HeroShowcase() {
  return (
    <div className="relative mx-auto hidden min-h-[480px] w-full max-w-xl items-center justify-center lg:flex">
      <div className="absolute h-[min(34rem,90vw)] w-[min(34rem,90vw)] rounded-full bg-cyan-400/10 blur-[80px]" />
      <div className="floating relative w-full max-w-[455px]">
        <div className="glass-card relative z-10 rounded-[1.75rem] p-4 shadow-[0_0_60px_rgba(8,189,255,0.16)]">
          <div className="tech-grid overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#061a3a]/90">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><div className="flex items-center gap-2.5"><Image src={brand.icon} alt="" width={28} height={28} className="h-7 w-7 object-contain" /><div><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-secondary">Creatiq Studio</p><p className="text-xs font-bold text-primary">Business Dashboard</p></div></div><Sparkles className="text-secondary" size={18} /></div>
            <div className="grid gap-3 p-4"><div className="grid grid-cols-3 gap-3">{[["Projects", "18"], ["Leads", "42"], ["Growth", "96%"]].map(([label, value]) => <div key={label} className="min-w-0 rounded-2xl bg-cyan-300/10 p-3"><p className="truncate text-[9px] uppercase tracking-widest text-muted">{label}</p><p className="mt-1.5 text-2xl font-black text-secondary">{value}</p></div>)}</div>
              <div className="rounded-2xl border border-white/10 bg-background/50 p-4"><div className="mb-4 flex items-center justify-between"><p className="text-xs font-bold text-primary">Creative Performance</p><span className="rounded-full bg-cyan-300/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-secondary">Live</span></div><div className="space-y-2.5">{["w-[86%]", "w-[72%]", "w-[94%]"].map((width) => <div key={width} className="h-2.5 w-full rounded-full bg-white/10"><div className={`h-2.5 ${width} rounded-full bg-gradient-to-r from-blue-600 to-cyan-300`} /></div>)}</div></div>
              <div className="grid grid-cols-2 gap-3"><ShowcaseCard icon={<Code2 size={22} />} title="Web Systems" description="Fast, responsive, and scalable platforms." /><ShowcaseCard icon={<Smartphone size={22} />} title="Mobile Apps" description="Smooth interfaces for modern users." /></div>
            </div>
          </div>
        </div>
        <div className="glass-card absolute -bottom-6 -left-5 z-20 w-44 rounded-2xl p-3 shadow-2xl"><Image src={brand.landscape} alt="Creatiq Digital Solutions" width={220} height={80} className="h-auto w-full object-contain" /></div>
      </div>
    </div>
  );
}

function ShowcaseCard({ icon, title, description }: { icon: ReactNode; title: string; description: string }) { return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><span className="mb-3 block text-secondary">{icon}</span><p className="text-sm font-bold text-primary">{title}</p><p className="mt-1.5 text-[11px] leading-5 text-muted">{description}</p></div>; }
