"use client";

import { ArrowLeft, ArrowRight, ExternalLink, ImageIcon } from "lucide-react";
import { useMemo, useState } from "react";
import Image from "next/image";
import type { PublicPortfolioProject } from "@/lib/crm/public-data";

const backgrounds = [
  "bg-[radial-gradient(circle_at_top,#08bdff,transparent_36%),linear-gradient(135deg,#061a3a,#1b0f44)]",
  "bg-[radial-gradient(circle_at_top,#bac3ff,transparent_36%),linear-gradient(135deg,#061a3a,#081327)]",
  "bg-[radial-gradient(circle_at_top,#86d2ff,transparent_36%),linear-gradient(135deg,#081327,#101d3a)]",
];

const VISIBLE_PROJECTS = 3;

export function PortfolioSection({
  projects,
}: {
  projects: PublicPortfolioProject[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const totalProjects = projects.length;
  const canSlide = totalProjects > VISIBLE_PROJECTS;

  const visibleProjects = useMemo(() => {
    if (totalProjects === 0) return [];

    const visibleCount = Math.min(VISIBLE_PROJECTS, totalProjects);

    return Array.from({ length: visibleCount }, (_, offset) => {
      const projectIndex = (activeIndex + offset) % totalProjects;

      return {
        project: projects[projectIndex],
        projectIndex,
      };
    });
  }, [activeIndex, projects, totalProjects]);

  const previousProject =
    totalProjects > 0
      ? projects[(activeIndex - 1 + totalProjects) % totalProjects]
      : null;

  const nextProject =
    totalProjects > 0 ? projects[(activeIndex + 1) % totalProjects] : null;

  const move = (direction: -1 | 1) => {
    if (!canSlide) return;

    setActiveIndex((index) => {
      return (index + direction + totalProjects) % totalProjects;
    });
  };

  if (totalProjects === 0) return null;

  return (
    <section id="portfolio" className="bg-background py-20 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 xl:px-16">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:mb-16 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
              Portfolio
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-primary md:text-4xl">
              Our Work
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              A glimpse into the digital solutions we build.
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <p
              className="text-xs font-semibold uppercase tracking-widest text-muted"
              aria-live="polite"
            >
              {activeIndex + 1} / {totalProjects}
            </p>

            <button
              type="button"
              onClick={() => move(-1)}
              disabled={!canSlide}
              aria-label={
                previousProject
                  ? `Show previous project: ${previousProject.title}`
                  : "Show previous project"
              }
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/10 text-muted transition hover:border-secondary hover:text-secondary disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
            >
              <ArrowLeft size={22} />
            </button>

            <button
              type="button"
              onClick={() => move(1)}
              disabled={!canSlide}
              aria-label={
                nextProject
                  ? `Show next project: ${nextProject.title}`
                  : "Show next project"
              }
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/10 text-muted transition hover:border-secondary hover:text-secondary disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
            >
              <ArrowRight size={22} />
            </button>
          </div>
        </div>

        <div
          className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3"
          aria-live="polite"
        >
          {visibleProjects.map(({ project, projectIndex }) => (
            <article
              key={`${project.slug}-${projectIndex}`}
              className="glass-card group overflow-hidden rounded-2xl border-cyan-300/15 bg-surface/60"
            >
              <div className="relative h-56 overflow-hidden border-b border-cyan-300/10">
                {project.image_url ? (
                  <Image
                    src={project.image_url}
                    alt={project.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-700 motion-safe:group-hover:scale-105"
                  />
                ) : (
                  <div
                    className={`absolute inset-0 ${
                      backgrounds[projectIndex % backgrounds.length]
                    }`}
                  >
                    <div className="absolute inset-0 tech-grid opacity-40" />

                    <div className="absolute inset-x-6 top-6 rounded-2xl border border-white/10 bg-background/35 p-4 backdrop-blur-md">
                      <div className="mb-4 flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-300/70" />
                        <span className="h-2.5 w-2.5 rounded-full bg-yellow-300/70" />
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/70" />
                      </div>

                      <div className="space-y-3">
                        <div className="h-3 w-3/4 rounded-full bg-cyan-300/25" />
                        <div className="h-3 w-1/2 rounded-full bg-cyan-300/15" />
                        <div className="grid grid-cols-3 gap-2 pt-3">
                          <div className="h-12 rounded-xl bg-cyan-300/10" />
                          <div className="h-12 rounded-xl bg-blue-500/20" />
                          <div className="h-12 rounded-xl bg-indigo-300/10" />
                        </div>
                      </div>
                    </div>

                    <div className="absolute bottom-5 left-6 flex items-center gap-2 rounded-full border border-cyan-300/15 bg-background/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-secondary backdrop-blur-md">
                      <ImageIcon size={13} />
                      Preview
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              </div>

              <div className="p-6 sm:p-7">
                <span className="rounded bg-cyan-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-secondary">
                  {project.category}
                </span>

                <h3 className="mt-3 text-xl font-bold text-foreground">
                  {project.title}
                </h3>

                <p className="mt-3 min-h-[4.5rem] text-sm leading-6 text-muted">
                  {project.summary}
                </p>

                <div className="mt-6">
                  {project.project_url ? (
                    <a
                      href={project.project_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-secondary transition hover:bg-cyan-300/15"
                    >
                      View project
                      <ExternalLink size={14} />
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted">
                      Case study preview
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
