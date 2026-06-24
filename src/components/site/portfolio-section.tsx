"use client";

import { ArrowLeft, ArrowRight, ExternalLink, ImageIcon } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import type { PublicProject } from "@/lib/crm/public-data";

const backgrounds = [
  "bg-[radial-gradient(circle_at_30%_0%,#08bdff,transparent_34%),linear-gradient(135deg,#061a3a,#1b0f44)]",
  "bg-[radial-gradient(circle_at_30%_0%,#bac3ff,transparent_34%),linear-gradient(135deg,#061a3a,#081327)]",
  "bg-[radial-gradient(circle_at_30%_0%,#86d2ff,transparent_34%),linear-gradient(135deg,#081327,#101d3a)]",
];

type VirtualProject = {
  project: PublicProject;
  realIndex: number;
  virtualIndex: number;
  clone: "first" | "last" | null;
};

export function PortfolioSection({ projects }: { projects: PublicProject[] }) {
  const totalProjects = projects.length;
  const canSlide = totalProjects > 1;

  const virtualProjects = useMemo<VirtualProject[]>(() => {
    if (!totalProjects) return [];

    if (totalProjects === 1) {
      return [
        {
          project: projects[0],
          realIndex: 0,
          virtualIndex: 0,
          clone: null,
        },
      ];
    }

    const lastProject = projects[totalProjects - 1];
    const firstProject = projects[0];

    return [
      {
        project: lastProject,
        realIndex: totalProjects - 1,
        virtualIndex: 0,
        clone: "last",
      },
      ...projects.map((project, index) => ({
        project,
        realIndex: index,
        virtualIndex: index + 1,
        clone: null,
      })),
      {
        project: firstProject,
        realIndex: 0,
        virtualIndex: totalProjects + 1,
        clone: "first",
      },
    ];
  }, [projects, totalProjects]);

  const startIndex = canSlide ? 1 : 0;

  const [selectedVirtualIndex, setSelectedVirtualIndex] = useState(startIndex);
  const [selectedRealIndex, setSelectedRealIndex] = useState(0);

  const dotsRef = useRef<HTMLDivElement>(null);
  const isDraggingDots = useRef(false);
  const dotDragStartX = useRef(0);
  const dotWasDragged = useRef(false);
  const lastDotIndex = useRef<number | null>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    loop: false,
    dragFree: false,
    skipSnaps: false,
    duration: 38,
    startIndex,
    containScroll: false,
  });

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const scrollToRealProject = useCallback(
    (realIndex: number) => {
      if (!emblaApi) return;

      const targetVirtualIndex = canSlide ? realIndex + 1 : realIndex;
      emblaApi.scrollTo(targetVirtualIndex);
    },
    [canSlide, emblaApi],
  );

  const updateSelected = useCallback(() => {
    if (!emblaApi) return;

    const snap = emblaApi.selectedScrollSnap();
    const selectedProject = virtualProjects[snap];

    if (!selectedProject) return;

    setSelectedVirtualIndex(snap);
    setSelectedRealIndex(selectedProject.realIndex);
  }, [emblaApi, virtualProjects]);

  const handleLoopReset = useCallback(() => {
    if (!emblaApi || !canSlide) return;

    const snap = emblaApi.selectedScrollSnap();

    if (snap === 0) {
      emblaApi.scrollTo(totalProjects, true);
      setSelectedVirtualIndex(totalProjects);
      setSelectedRealIndex(totalProjects - 1);
      return;
    }

    if (snap === totalProjects + 1) {
      emblaApi.scrollTo(1, true);
      setSelectedVirtualIndex(1);
      setSelectedRealIndex(0);
    }
  }, [canSlide, emblaApi, totalProjects]);

  function getDotIndexFromClientX(clientX: number) {
    const dots = dotsRef.current;

    if (!dots) return null;

    const buttons = Array.from(
      dots.querySelectorAll<HTMLButtonElement>("[data-dot-index]"),
    );

    if (!buttons.length) return null;

    const rect = dots.getBoundingClientRect();
    const x = clientX - rect.left + dots.scrollLeft;

    let closestIndex: number | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const button of buttons) {
      const index = Number(button.dataset.dotIndex);

      if (!Number.isFinite(index)) continue;

      const center = button.offsetLeft + button.offsetWidth / 2;
      const distance = Math.abs(x - center);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    }

    return closestIndex;
  }

  function dragDotsTo(clientX: number) {
    const index = getDotIndexFromClientX(clientX);

    if (index === null || index === lastDotIndex.current) return;

    lastDotIndex.current = index;
    scrollToRealProject(index);

    const activeDot = dotsRef.current?.querySelector<HTMLButtonElement>(
      `[data-dot-index="${index}"]`,
    );

    activeDot?.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: isDraggingDots.current ? "auto" : "smooth",
    });
  }

  function handleDotsPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!canSlide) return;

    isDraggingDots.current = true;
    dotWasDragged.current = false;
    lastDotIndex.current = null;
    dotDragStartX.current = event.clientX;

    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();

    dragDotsTo(event.clientX);
  }

  function handleDotsPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!isDraggingDots.current || !canSlide) return;

    if (Math.abs(event.clientX - dotDragStartX.current) > 4) {
      dotWasDragged.current = true;
    }

    event.preventDefault();
    dragDotsTo(event.clientX);
  }

  function handleDotsPointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (!isDraggingDots.current) return;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // pointer capture may already be released
    }

    isDraggingDots.current = false;
    lastDotIndex.current = null;

    window.setTimeout(() => {
      dotWasDragged.current = false;
    }, 120);
  }

  function handleDotClick(index: number) {
    if (dotWasDragged.current) {
      dotWasDragged.current = false;
      return;
    }

    scrollToRealProject(index);
  }

  useEffect(() => {
    if (!emblaApi) return;

    emblaApi.scrollTo(startIndex, true);
    updateSelected();

    emblaApi.on("select", updateSelected);
    emblaApi.on("reInit", updateSelected);
    emblaApi.on("settle", handleLoopReset);

    return () => {
      emblaApi.off("select", updateSelected);
      emblaApi.off("reInit", updateSelected);
      emblaApi.off("settle", handleLoopReset);
    };
  }, [emblaApi, handleLoopReset, startIndex, updateSelected]);

  if (!totalProjects) return null;

  return (
    <section
      id="projects"
      className="relative overflow-x-clip bg-background py-16 sm:py-24 lg:py-32"
    >
      <div className="pointer-events-none absolute inset-x-0 top-[7rem] h-[34rem] sm:top-[8rem] sm:h-[46rem]">
        <div className="absolute left-1/2 top-1/2 h-[28rem] w-[70rem] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(8,189,255,0.16)_0%,rgba(8,189,255,0.09)_36%,rgba(8,189,255,0.035)_60%,transparent_80%)] blur-3xl sm:h-[38rem] sm:w-[150rem]" />
        <div className="absolute left-1/2 top-1/2 h-[20rem] w-[55rem] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.13)_0%,rgba(37,99,235,0.065)_46%,transparent_78%)] blur-2xl sm:h-[28rem] sm:w-[115rem]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 xl:px-16">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:mb-14 lg:flex-row lg:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
              Projects
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-primary md:text-4xl">
              Project Gallery
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              A visual-first showcase of websites, systems, mobile apps, and
              creative projects built by the people behind Creatiq.
            </p>
          </div>

          <p className="w-fit rounded-full border border-cyan-300/15 bg-cyan-300/[0.05] px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted">
            <span className="text-secondary">{selectedRealIndex + 1}</span>
            {" / "}
            {totalProjects}
          </p>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[138rem] px-0">
        <button
          type="button"
          onClick={scrollPrev}
          disabled={!canSlide}
          aria-label="Show previous project"
          className="absolute left-4 top-1/2 z-50 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-300/20 bg-background/80 text-primary shadow-[0_0_35px_rgba(8,189,255,0.15)] backdrop-blur-md transition hover:border-secondary hover:bg-cyan-300/10 hover:text-secondary disabled:cursor-not-allowed disabled:opacity-40 sm:inline-flex xl:left-10"
        >
          <ArrowLeft size={23} />
        </button>

        <button
          type="button"
          onClick={scrollNext}
          disabled={!canSlide}
          aria-label="Show next project"
          className="absolute right-4 top-1/2 z-50 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-300/20 bg-background/80 text-primary shadow-[0_0_35px_rgba(8,189,255,0.15)] backdrop-blur-md transition hover:border-secondary hover:bg-cyan-300/10 hover:text-secondary disabled:cursor-not-allowed disabled:opacity-40 sm:inline-flex xl:right-10"
        >
          <ArrowRight size={23} />
        </button>

        <div
          ref={emblaRef}
          className="overflow-hidden px-0 sm:px-10 lg:px-16 xl:px-24 sm:[mask-image:linear-gradient(90deg,transparent_0%,black_5%,black_95%,transparent_100%)]"
        >
          <div className="flex touch-pan-y select-none py-6 sm:py-8">
            {virtualProjects.map((item) => {
              const isActive = item.virtualIndex === selectedVirtualIndex;

              return (
                <ProjectSlide
                  key={`${item.project.slug}-${item.virtualIndex}-${item.clone ?? "real"}`}
                  project={item.project}
                  projectIndex={item.realIndex}
                  isActive={isActive}
                  onSelect={() => scrollToRealProject(item.realIndex)}
                />
              );
            })}
          </div>
        </div>

        <div className="mt-2 flex justify-center px-4 sm:mt-3">
          <div
            ref={dotsRef}
            onPointerDown={handleDotsPointerDown}
            onPointerMove={handleDotsPointerMove}
            onPointerUp={handleDotsPointerEnd}
            onPointerCancel={handleDotsPointerEnd}
            onDragStart={(event) => event.preventDefault()}
            className="no-scrollbar flex max-w-full touch-none select-none items-center gap-2 overflow-x-auto rounded-full border border-cyan-300/15 bg-background/75 px-3 py-2 backdrop-blur-md"
            aria-label="Project carousel navigation"
          >
            {projects.map((project, index) => (
              <button
                key={`${project.slug}-dot-${index}`}
                type="button"
                data-dot-index={index}
                onClick={() => handleDotClick(index)}
                aria-label={`Show project ${index + 1}`}
                className={`h-2 shrink-0 rounded-full transition-all ${
                  index === selectedRealIndex
                    ? "w-8 bg-secondary shadow-[0_0_14px_rgba(8,189,255,0.8)]"
                    : "w-2 bg-primary/25 hover:bg-secondary/60"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProjectSlide({
  project,
  projectIndex,
  isActive,
  onSelect,
}: {
  project: PublicProject;
  projectIndex: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <article
      className={`group min-w-0 shrink-0 grow-0 basis-[88%] px-2 transition-[opacity,transform,filter] duration-500 sm:basis-[74%] sm:px-4 lg:basis-[60rem] xl:basis-[64rem] ${
        isActive
          ? "scale-100 opacity-100 blur-0"
          : "scale-[0.86] opacity-35 blur-[1px] sm:scale-[0.82]"
      }`}
    >
      <div
        role="button"
        tabIndex={isActive ? -1 : 0}
        onClick={() => {
          if (!isActive) onSelect();
        }}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === " ") && !isActive) {
            event.preventDefault();
            onSelect();
          }
        }}
        className={`relative h-[31rem] cursor-grab overflow-hidden rounded-[1.5rem] border bg-background/35 shadow-[0_0_70px_rgba(0,0,0,0.25)] backdrop-blur-md active:cursor-grabbing sm:h-[32rem] sm:rounded-[2rem] lg:h-[34rem] xl:h-[36rem] ${
          isActive
            ? "border-secondary/60 shadow-[0_0_100px_rgba(8,189,255,0.18)]"
            : "border-cyan-300/15"
        }`}
      >
        <ProjectPreviewImage
          project={project}
          projectIndex={projectIndex}
          priority={isActive}
        />

        {!isActive ? (
          <div className="pointer-events-none absolute inset-0 bg-black/45 sm:bg-black/40" />
        ) : null}

        {isActive ? (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-end bg-black/0 p-4 opacity-0 backdrop-blur-0 transition duration-500 group-hover:pointer-events-auto group-hover:bg-black/80 group-hover:opacity-100 group-hover:backdrop-blur-[3px] sm:p-6 lg:p-8">
            <div className="w-full max-w-3xl translate-y-5 transition duration-500 group-hover:translate-y-0">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-cyan-300/25 bg-cyan-300/15 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-secondary backdrop-blur-md sm:text-[10px]">
                  {project.category}
                </span>

                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-white/85 backdrop-blur-md sm:text-[10px]">
                  {formatProjectType(project.project_type)}
                </span>

                {project.project_date ? (
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-white/65 backdrop-blur-md sm:text-[10px]">
                    {project.project_date}
                  </span>
                ) : null}
              </div>

              <h3 className="mt-3 line-clamp-2 text-2xl font-black tracking-[-0.05em] text-white sm:mt-4 sm:text-4xl lg:text-5xl">
                {project.title}
              </h3>

              <p className="mt-3 line-clamp-3 max-w-2xl text-xs leading-6 text-white/75 sm:mt-4 sm:text-sm sm:leading-7">
                {project.summary}
              </p>

              <div className="mt-4 sm:mt-6">
                {project.project_url ? (
                  <a
                    href={project.project_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="primary-btn inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-[10px] font-black uppercase tracking-widest text-white sm:h-12 sm:px-6 sm:text-xs"
                  >
                    View project
                    <ExternalLink size={15} />
                  </a>
                ) : (
                  <span className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 text-[10px] font-black uppercase tracking-widest text-white/70 backdrop-blur-md sm:h-12 sm:px-6 sm:text-xs">
                    Case study preview
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ProjectPreviewImage({
  project,
  projectIndex,
  priority = false,
}: {
  project: PublicProject;
  projectIndex: number;
  priority?: boolean;
}) {
  if (!project.image_url) {
    return <ProjectFallback projectIndex={projectIndex} />;
  }

  return (
    <Image
      src={project.image_url}
      alt={project.title}
      fill
      priority={priority}
      draggable={false}
      sizes="(min-width: 1536px) 64rem, (min-width: 1280px) 60rem, (min-width: 640px) 74vw, 88vw"
      className="pointer-events-none object-contain p-3 sm:p-8"
    />
  );
}

function ProjectFallback({ projectIndex }: { projectIndex: number }) {
  return (
    <div
      className={`absolute inset-0 ${
        backgrounds[projectIndex % backgrounds.length]
      }`}
    >
      <div className="absolute inset-0 tech-grid opacity-40" />

      <div className="absolute inset-x-5 top-5 rounded-2xl border border-white/10 bg-background/35 p-4 backdrop-blur-md">
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

      <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-full border border-cyan-300/15 bg-background/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-secondary backdrop-blur-md">
        <ImageIcon size={13} />
        Preview
      </div>
    </div>
  );
}

function formatProjectType(value: string | null | undefined) {
  if (!value) return "Featured";

  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
