"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";

const projects = [
  {
    category: "Social Media",
    title: "Brand Campaign System",
    description: "Strategy, content design, and visual direction for online growth.",
  },
  {
    category: "Identity",
    title: "Tech Brand Rebrand",
    description: "Logo design, brand direction, and complete visual identity.",
  },
  {
    category: "Web Development",
    title: "Business Website Platform",
    description: "Modern website design with responsive and conversion-focused UI.",
  },
];

const backgrounds = [
  "bg-[radial-gradient(circle_at_top,#08bdff,transparent_36%),linear-gradient(135deg,#061a3a,#1b0f44)]",
  "bg-[radial-gradient(circle_at_top,#bac3ff,transparent_36%),linear-gradient(135deg,#061a3a,#081327)]",
  "bg-[radial-gradient(circle_at_top,#86d2ff,transparent_36%),linear-gradient(135deg,#081327,#101d3a)]",
];

export function PortfolioSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const visibleProjects = useMemo(
    () => projects.map((_, offset) => projects[(activeIndex + offset) % projects.length]),
    [activeIndex],
  );

  const previousProject = projects[(activeIndex - 1 + projects.length) % projects.length];
  const nextProject = projects[(activeIndex + 1) % projects.length];

  const move = (direction: -1 | 1) => {
    setActiveIndex((index) => (index + direction + projects.length) % projects.length);
  };

  return (
    <section id="portfolio" className="bg-background py-20 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 xl:px-16">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:mb-16 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-bold text-primary md:text-4xl">Our Work</h2>
            <p className="mt-2 text-muted">A glimpse into the digital solutions we build.</p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted" aria-live="polite">
              <span className="sr-only">Current featured project: </span>
              {activeIndex + 1} / {projects.length}
            </p>
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label={`Show previous project: ${previousProject.title}`}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/10 text-muted transition hover:border-secondary hover:text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
            >
              <ArrowLeft size={22} />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label={`Show next project: ${nextProject.title}`}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/10 text-muted transition hover:border-secondary hover:text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
            >
              <ArrowRight size={22} />
            </button>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3" aria-live="polite">
          {visibleProjects.map((project) => (
            <article key={project.title} className="glass-card group relative aspect-[4/5] overflow-hidden rounded-2xl border-none">
              <div className={`absolute inset-0 transition duration-700 motion-safe:group-hover:scale-110 ${backgrounds[projects.indexOf(project)]}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-90" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <span className="rounded bg-cyan-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-secondary">{project.category}</span>
                <h3 className="mt-2 text-xl font-bold text-foreground">{project.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted sm:opacity-0 sm:transition sm:duration-300 sm:group-hover:opacity-100">{project.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
