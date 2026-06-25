"use client";

import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Clapperboard,
  Code2,
  ExternalLink,
  ImageIcon,
  Paintbrush,
  PenTool,
  Play,
  Share2,
  Smartphone,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  forwardRef,
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

// ---------------------------------------------------------------------------
// Layout variant per filter
// "carousel"  → existing full-bleed embla carousel (web, mobile, ui/ux, all)
// "masonry"   → multi-column masonry grid (graphic design, branding)
// "social"    → square/portrait feed grid (social media)
// "video"     → dark tile grid with play overlay (video editing)
// ---------------------------------------------------------------------------
type LayoutVariant = "carousel" | "masonry" | "social" | "video";

const backgrounds = [
  "bg-[radial-gradient(circle_at_30%_0%,#08bdff,transparent_34%),linear-gradient(135deg,#061a3a,#1b0f44)]",
  "bg-[radial-gradient(circle_at_30%_0%,#bac3ff,transparent_34%),linear-gradient(135deg,#061a3a,#081327)]",
  "bg-[radial-gradient(circle_at_30%_0%,#86d2ff,transparent_34%),linear-gradient(135deg,#081327,#101d3a)]",
];

type ServiceFilterKey =
  | "all"
  | "graphic-design"
  | "web-systems"
  | "social-media"
  | "branding"
  | "mobile-app"
  | "ui-ux"
  | "video-editing";

type ServiceFilter = {
  key: ServiceFilterKey;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  keywords: string[];
  layout: LayoutVariant;
};

const serviceFilters: ServiceFilter[] = [
  {
    key: "all",
    label: "All Projects",
    shortLabel: "All",
    description: "Browse every featured work across Creatiq services.",
    icon: Sparkles,
    keywords: [],
    layout: "carousel",
  },
  {
    key: "graphic-design",
    label: "Graphic Design",
    shortLabel: "Graphics",
    description: "Posters, layouts, print designs, and visual creatives.",
    icon: Paintbrush,
    keywords: [
      "graphic",
      "graphics",
      "poster",
      "layout",
      "print",
      "flyer",
      "banner",
      "creative",
      "design",
      "visual",
    ],
    layout: "masonry",
  },
  {
    key: "web-systems",
    label: "Web & Custom Systems",
    shortLabel: "Web/System",
    description:
      "Websites, dashboards, booking apps, CRM, and internal systems.",
    icon: Code2,
    keywords: [
      "web",
      "website",
      "system",
      "systems",
      "dashboard",
      "admin",
      "crm",
      "booking",
      "platform",
      "management",
      "inventory",
      "pos",
      "ecommerce",
      "e-commerce",
      "portal",
    ],
    layout: "carousel",
  },
  {
    key: "social-media",
    label: "Social Media",
    shortLabel: "Social",
    description:
      "Campaign visuals, content systems, and social media creatives.",
    icon: Share2,
    keywords: [
      "social",
      "facebook",
      "instagram",
      "campaign",
      "content",
      "marketing",
      "post",
      "page",
      "ads",
    ],
    layout: "social",
  },
  {
    key: "branding",
    label: "Branding & Logo",
    shortLabel: "Branding",
    description: "Logo, identity systems, brand refresh, and visual direction.",
    icon: BadgeCheck,
    keywords: [
      "brand",
      "branding",
      "logo",
      "identity",
      "rebrand",
      "brand identity",
      "visual identity",
    ],
    layout: "masonry",
  },
  {
    key: "mobile-app",
    label: "Mobile App",
    shortLabel: "Mobile",
    description: "Mobile applications and app-based digital experiences.",
    icon: Smartphone,
    keywords: [
      "mobile",
      "app",
      "application",
      "android",
      "ios",
      "react native",
      "expo",
      "tablet",
    ],
    layout: "carousel",
  },
  {
    key: "ui-ux",
    label: "UI/UX Design",
    shortLabel: "UI/UX",
    description:
      "Interfaces, prototypes, wireframes, and user experience work.",
    icon: PenTool,
    keywords: [
      "ui",
      "ux",
      "ui/ux",
      "interface",
      "prototype",
      "wireframe",
      "figma",
      "experience",
      "design system",
    ],
    layout: "carousel",
  },
  {
    key: "video-editing",
    label: "Video Editing",
    shortLabel: "Video",
    description: "Video edits, motion graphics, reels, and marketing visuals.",
    icon: Clapperboard,
    keywords: [
      "video",
      "editing",
      "motion",
      "reel",
      "animation",
      "short form",
      "trailer",
      "promo",
    ],
    layout: "video",
  },
];

// ---------------------------------------------------------------------------
// Carousel internals (unchanged from original)
// ---------------------------------------------------------------------------

type VirtualProject = {
  project: PublicProject;
  realIndex: number;
  virtualIndex: number;
  clone: "first" | "last" | null;
};

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

export function PortfolioSection({ projects }: { projects: PublicProject[] }) {
  const [selectedFilter, setSelectedFilter] = useState<ServiceFilterKey>("all");

  const activeFilter =
    serviceFilters.find((f) => f.key === selectedFilter) ?? serviceFilters[0];

  const filtersWithCounts = useMemo(() => {
    return serviceFilters.map((filter) => ({
      ...filter,
      count:
        filter.key === "all"
          ? projects.length
          : projects.filter((p) => matchesServiceFilter(p, filter)).length,
    }));
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (selectedFilter === "all") return projects;
    return projects.filter((p) => matchesServiceFilter(p, activeFilter));
  }, [activeFilter, projects, selectedFilter]);

  function changeFilter(filterKey: ServiceFilterKey) {
    setSelectedFilter(filterKey);
  }

  if (!projects.length) return null;

  return (
    <section
      id="projects"
      className="relative overflow-x-clip bg-background py-8 sm:py-12 lg:py-16"
    >
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-[6rem] h-[32rem] sm:top-[8rem] sm:h-[46rem]">
        <div className="absolute left-1/2 top-1/2 h-[26rem] w-[64rem] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(8,189,255,0.16)_0%,rgba(8,189,255,0.09)_36%,rgba(8,189,255,0.035)_60%,transparent_80%)] blur-3xl sm:h-[38rem] sm:w-[150rem]" />
        <div className="absolute left-1/2 top-1/2 h-[18rem] w-[52rem] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.13)_0%,rgba(37,99,235,0.065)_46%,transparent_78%)] blur-2xl sm:h-[28rem] sm:w-[115rem]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 xl:px-16">
        {/* header */}
        <div className="mb-4 flex flex-col justify-between gap-3 sm:mb-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
              Projects
            </p>
            <h2 className="mt-1 text-xl font-black tracking-[-0.04em] text-primary sm:text-2xl lg:text-3xl">
              Project Gallery
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
              Filter our work by expertise and explore examples that match the
              service your brand needs.
            </p>
          </div>

          <div className="w-fit rounded-xl border border-cyan-300/15 bg-cyan-300/[0.05] px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">
              Showing
            </p>
            <p className="mt-0.5 text-xs font-black text-primary">
              {filteredProjects.length}{" "}
              <span className="text-muted">in {activeFilter.shortLabel}</span>
            </p>
          </div>
        </div>

        {/* filter bar */}
        <div className="mb-4 flex items-center gap-3">
          <p className="hidden shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-secondary sm:block">
            Filter
          </p>
          <FilterStrip
            filters={filtersWithCounts}
            selectedFilter={selectedFilter}
            onSelect={changeFilter}
          />
        </div>
      </div>

      {/* layout switcher */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          activeFilter={activeFilter}
          onReset={() => changeFilter("all")}
        />
      ) : activeFilter.layout === "masonry" ? (
        <MasonryLayout projects={filteredProjects} />
      ) : activeFilter.layout === "social" ? (
        <SocialLayout projects={filteredProjects} />
      ) : activeFilter.layout === "video" ? (
        <VideoLayout projects={filteredProjects} />
      ) : (
        <CarouselLayout projects={filteredProjects} />
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Filter strip — compact segmented pill bar
// ---------------------------------------------------------------------------

function FilterStrip({
  filters,
  selectedFilter,
  onSelect,
}: {
  filters: (ServiceFilter & { count: number })[];
  selectedFilter: ServiceFilterKey;
  onSelect: (key: ServiceFilterKey) => void;
}) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: "smooth",
    });
  }, [selectedFilter]);

  const visible = filters.filter((f) => f.key === "all" || f.count > 0);

  return (
    <div className="relative min-w-0 flex-1">
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent" />

      <div className="flex gap-1 overflow-x-auto scroll-smooth rounded-xl border border-cyan-300/10 bg-white/[0.03] p-1 [scrollbar-width:thin] [scrollbar-color:rgba(8,189,255,0.3)_transparent] [&::-webkit-scrollbar]:h-[3px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-300/30 [&::-webkit-scrollbar-thumb:hover]:bg-cyan-300/60">
        {visible.map((filter) => (
          <FilterButton
            key={filter.key}
            ref={filter.key === selectedFilter ? activeRef : undefined}
            filter={filter}
            active={selectedFilter === filter.key}
            onClick={() => onSelect(filter.key)}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter button
// ---------------------------------------------------------------------------

const FilterButton = forwardRef<
  HTMLButtonElement,
  {
    filter: ServiceFilter & { count: number };
    active: boolean;
    onClick: () => void;
  }
>(function FilterButton({ filter, active, onClick }, ref) {
  const Icon = filter.icon;

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={`${filter.label} (${filter.count})`}
      className={`group relative flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left transition-all duration-200 ${
        active
          ? "bg-cyan-300/15 text-secondary shadow-[0_0_20px_rgba(8,189,255,0.15)] ring-1 ring-secondary/40"
          : "text-muted hover:bg-white/[0.06] hover:text-primary"
      }`}
    >
      {/* icon */}
      <Icon size={13} className="shrink-0" />

      {/* label */}
      <span className="shrink-0 text-[11px] font-bold">
        {filter.shortLabel}
      </span>

      {/* count badge */}
      <span
        className={`shrink-0 rounded-full px-1.5 py-px text-[9px] font-black tabular-nums transition-colors ${
          active
            ? "bg-secondary/20 text-secondary"
            : "bg-white/[0.07] text-muted group-hover:bg-white/10"
        }`}
      >
        {filter.count}
      </span>
    </button>
  );
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({
  activeFilter,
  onReset,
}: {
  activeFilter: ServiceFilter;
  onReset: () => void;
}) {
  return (
    <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
      <div className="rounded-[2rem] border border-cyan-300/15 bg-surface/60 p-8 text-center shadow-[0_0_70px_rgba(8,189,255,0.08)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-secondary">
          <activeFilter.icon size={24} />
        </div>
        <h3 className="mt-5 text-2xl font-black text-primary">
          No {activeFilter.label} examples yet
        </h3>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">
          Add or categorize projects in the CRM using this service category so
          they appear here.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="mt-6 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-secondary transition hover:bg-cyan-300/15"
        >
          View all projects
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CAROUSEL LAYOUT (web, mobile, ui/ux, all — unchanged logic)
// ---------------------------------------------------------------------------

function CarouselLayout({ projects }: { projects: PublicProject[] }) {
  const totalProjects = projects.length;
  const canSlide = totalProjects > 1;

  const virtualProjects = useMemo<VirtualProject[]>(() => {
    if (!totalProjects) return [];
    if (totalProjects === 1) {
      return [
        { project: projects[0], realIndex: 0, virtualIndex: 0, clone: null },
      ];
    }
    return [
      {
        project: projects[totalProjects - 1],
        realIndex: totalProjects - 1,
        virtualIndex: 0,
        clone: "last",
      },
      ...projects.map((p, i) => ({
        project: p,
        realIndex: i,
        virtualIndex: i + 1,
        clone: null as null,
      })),
      {
        project: projects[0],
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

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const scrollToRealProject = useCallback(
    (realIndex: number) => {
      if (!emblaApi) return;
      emblaApi.scrollTo(canSlide ? realIndex + 1 : realIndex);
    },
    [canSlide, emblaApi],
  );

  const updateSelected = useCallback(() => {
    if (!emblaApi) return;
    const snap = emblaApi.selectedScrollSnap();
    const sel = virtualProjects[snap];
    if (!sel) return;
    setSelectedVirtualIndex(snap);
    setSelectedRealIndex(sel.realIndex);
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
    if (Math.abs(event.clientX - dotDragStartX.current) > 4)
      dotWasDragged.current = true;
    event.preventDefault();
    dragDotsTo(event.clientX);
  }

  function handleDotsPointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (!isDraggingDots.current) return;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
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
    emblaApi.reInit();
    emblaApi.scrollTo(startIndex, true);
    setSelectedVirtualIndex(startIndex);
    setSelectedRealIndex(0);
  }, [emblaApi, startIndex, totalProjects]);

  useEffect(() => {
    if (!emblaApi || !totalProjects) return;
    updateSelected();
    emblaApi.on("select", updateSelected);
    emblaApi.on("reInit", updateSelected);
    emblaApi.on("settle", handleLoopReset);
    return () => {
      emblaApi.off("select", updateSelected);
      emblaApi.off("reInit", updateSelected);
      emblaApi.off("settle", handleLoopReset);
    };
  }, [emblaApi, handleLoopReset, totalProjects, updateSelected]);

  return (
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
        <div className="flex touch-pan-y select-none py-4 sm:py-8">
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
          onDragStart={(e) => e.preventDefault()}
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
  );
}

// ---------------------------------------------------------------------------
// MASONRY LAYOUT — graphic design & branding
// CSS columns masonry; images shown at natural ratio with hover overlay
// ---------------------------------------------------------------------------

function MasonryLayout({ projects }: { projects: PublicProject[] }) {
  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 xl:px-16">
      {/* CSS multi-column masonry — no JS needed */}
      <div className="columns-2 gap-2 sm:columns-3 sm:gap-3 lg:columns-4 xl:columns-5">
        {projects.map((project, index) => (
          <MasonryCard
            key={project.slug}
            project={project}
            projectIndex={index}
          />
        ))}
      </div>
    </div>
  );
}

function MasonryCard({
  project,
  projectIndex,
}: {
  project: PublicProject;
  projectIndex: number;
}) {
  // Vary aspect ratio to create visual rhythm
  const aspectClasses = [
    "aspect-[3/4]",
    "aspect-square",
    "aspect-[4/5]",
    "aspect-[2/3]",
  ];
  const aspect = aspectClasses[projectIndex % aspectClasses.length];

  return (
    <div className="group mb-2 break-inside-avoid sm:mb-3">
      <div
        className={`relative w-full overflow-hidden rounded-2xl border border-cyan-300/15 bg-background/35 ${aspect}`}
      >
        {project.image_url ? (
          <Image
            src={project.image_url}
            alt={project.title}
            fill
            draggable={false}
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 50vw"
            className="pointer-events-none object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <ProjectFallback projectIndex={projectIndex} />
        )}

        {/* hover overlay */}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:p-4">
          <span className="mb-1.5 inline-block w-fit rounded-full border border-cyan-300/25 bg-cyan-300/15 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-secondary">
            {project.category}
          </span>
          <h3 className="line-clamp-2 text-sm font-black leading-tight text-white sm:text-base">
            {project.title}
          </h3>
          {project.project_url && (
            <a
              href={project.project_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2.5 inline-flex w-fit items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white backdrop-blur-md transition hover:bg-white/20"
            >
              View <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SOCIAL LAYOUT — social media creatives
// Square feed grid, 3-col on desktop, 2-col on mobile; numbered position badge
// ---------------------------------------------------------------------------

function SocialLayout({ projects }: { projects: PublicProject[] }) {
  const [lightbox, setLightbox] = useState<PublicProject | null>(null);

  return (
    <>
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 md:grid-cols-4 lg:gap-3">
          {projects.map((project, index) => (
            <SocialCard
              key={project.slug}
              project={project}
              projectIndex={index}
              onExpand={() => setLightbox(project)}
            />
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-cyan-300/20 bg-background shadow-[0_0_100px_rgba(8,189,255,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-square w-full">
              {lightbox.image_url ? (
                <Image
                  src={lightbox.image_url}
                  alt={lightbox.title}
                  fill
                  className="object-contain"
                />
              ) : (
                <ProjectFallback projectIndex={0} />
              )}
            </div>
            <div className="p-5">
              <span className="inline-block rounded-full border border-cyan-300/25 bg-cyan-300/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-secondary">
                {lightbox.category}
              </span>
              <h3 className="mt-2 text-xl font-black text-primary">
                {lightbox.title}
              </h3>
              {lightbox.summary && (
                <p className="mt-1.5 text-sm leading-6 text-muted">
                  {lightbox.summary}
                </p>
              )}
              {lightbox.project_url && (
                <a
                  href={lightbox.project_url}
                  target="_blank"
                  rel="noreferrer"
                  className="primary-btn mt-4 inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[9px] font-black uppercase tracking-widest text-white"
                >
                  View project <ExternalLink size={13} />
                </a>
              )}
            </div>
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/70 transition hover:bg-white/20"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function SocialCard({
  project,
  projectIndex,
  onExpand,
}: {
  project: PublicProject;
  projectIndex: number;
  onExpand: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-cyan-300/10 bg-background/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
    >
      {project.image_url ? (
        <Image
          src={project.image_url}
          alt={project.title}
          fill
          draggable={false}
          sizes="(min-width: 1024px) 33vw, 50vw"
          className="pointer-events-none object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <ProjectFallback projectIndex={projectIndex} />
      )}

      {/* hover overlay */}
      <div className="absolute inset-0 flex flex-col items-start justify-end bg-gradient-to-t from-black/85 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span className="mb-1 inline-block rounded-full border border-cyan-300/30 bg-cyan-300/20 px-2 py-0.5 text-[7px] font-bold uppercase tracking-widest text-secondary">
          {project.category}
        </span>
        <p className="line-clamp-2 text-left text-xs font-black leading-tight text-white">
          {project.title}
        </p>
      </div>

      {/* index badge */}
      <span className="absolute left-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-black/50 text-[9px] font-bold text-white/70 backdrop-blur-md">
        {projectIndex + 1}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// VIDEO LAYOUT — video editing work
// Dark 16:9 tiles in a 2-col grid; prominent play button; thumbnail
// ---------------------------------------------------------------------------

function VideoLayout({ projects }: { projects: PublicProject[] }) {
  const [playing, setPlaying] = useState<string | null>(null);

  return (
    <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-10 xl:px-16">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:gap-5">
        {projects.map((project, index) => (
          <VideoCard
            key={project.slug}
            project={project}
            projectIndex={index}
            isPlaying={playing === project.slug}
            onPlay={() => setPlaying(project.slug)}
          />
        ))}
      </div>
    </div>
  );
}

function VideoCard({
  project,
  projectIndex,
  isPlaying,
  onPlay,
}: {
  project: PublicProject;
  projectIndex: number;
  isPlaying: boolean;
  onPlay: () => void;
}) {
  // Detect if the project_url is a video embed (YouTube / Vimeo)
  const embedUrl = getVideoEmbedUrl(project.project_url);

  return (
    <div className="group overflow-hidden rounded-2xl border border-cyan-300/15 bg-background/50 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
      {/* video / thumbnail area */}
      <div className="relative aspect-video w-full bg-black">
        {isPlaying && embedUrl ? (
          <iframe
            src={`${embedUrl}?autoplay=1`}
            title={project.title}
            allow="autoplay; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <>
            {project.image_url ? (
              <Image
                src={project.image_url}
                alt={project.title}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="pointer-events-none object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            ) : (
              <ProjectFallback projectIndex={projectIndex} />
            )}

            {/* dark scrim */}
            <div className="absolute inset-0 bg-black/30 transition-opacity duration-300 group-hover:bg-black/50" />

            {/* play button */}
            <button
              type="button"
              onClick={embedUrl ? onPlay : undefined}
              aria-label={
                embedUrl ? `Play ${project.title}` : "No video available"
              }
              className={`absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/15 backdrop-blur-md transition-all duration-300 sm:h-20 sm:w-20 ${
                embedUrl
                  ? "cursor-pointer hover:scale-110 hover:bg-white/25 group-hover:scale-105"
                  : "cursor-default opacity-50"
              }`}
            >
              <Play
                size={28}
                className="translate-x-0.5 fill-white text-white"
              />
            </button>

            {/* duration / type badge */}
            <span className="absolute bottom-3 right-3 rounded-lg border border-white/15 bg-black/70 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white/80 backdrop-blur-md">
              {formatProjectType(project.project_type)}
            </span>
          </>
        )}
      </div>

      {/* meta */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-block rounded-full border border-cyan-300/25 bg-cyan-300/15 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-secondary">
              {project.category}
            </span>
            <h3 className="mt-2 line-clamp-1 text-base font-black text-primary sm:text-lg">
              {project.title}
            </h3>
            {project.summary && (
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                {project.summary}
              </p>
            )}
          </div>

          {project.project_url && (
            <a
              href={project.project_url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 shrink-0 flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-secondary transition hover:bg-cyan-300/20"
              aria-label="Open project"
            >
              <ExternalLink size={15} />
            </a>
          )}
        </div>

        {project.project_date && (
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-muted/60">
            {project.project_date}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Carousel slide (unchanged)
// ---------------------------------------------------------------------------

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
      className={`group min-w-0 shrink-0 grow-0 basis-[90%] px-1.5 transition-[opacity,transform,filter] duration-500 sm:basis-[72%] sm:px-2.5 lg:basis-[42rem] xl:basis-[48rem] ${
        isActive
          ? "scale-100 opacity-100 blur-0"
          : "scale-[0.9] opacity-35 blur-[1px] sm:scale-[0.84]"
      }`}
    >
      <div
        role="button"
        tabIndex={isActive ? -1 : 0}
        onClick={() => {
          if (!isActive) onSelect();
        }}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isActive) {
            e.preventDefault();
            onSelect();
          }
        }}
        className={`relative h-[18rem] cursor-grab overflow-hidden rounded-[1.25rem] border bg-background/35 shadow-[0_0_60px_rgba(0,0,0,0.22)] backdrop-blur-md active:cursor-grabbing sm:h-[22rem] sm:rounded-[1.5rem] lg:h-[26rem] xl:h-[28rem] ${
          isActive
            ? "border-secondary/60 shadow-[0_0_80px_rgba(8,189,255,0.16)]"
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
          <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 flex items-end bg-gradient-to-t from-black/95 via-black/65 to-transparent p-3 opacity-100 backdrop-blur-[2px] sm:pointer-events-none sm:inset-0 sm:bg-black/0 sm:p-4 sm:opacity-0 sm:backdrop-blur-0 sm:transition sm:duration-500 sm:group-hover:pointer-events-auto sm:group-hover:bg-black/80 sm:group-hover:opacity-100 sm:group-hover:backdrop-blur-[3px] lg:p-5">
            <div className="w-full max-w-2xl translate-y-0 sm:translate-y-4 sm:transition sm:duration-500 sm:group-hover:translate-y-0">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-cyan-300/25 bg-cyan-300/15 px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest text-secondary backdrop-blur-md sm:text-[9px]">
                  {project.category}
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest text-white/85 backdrop-blur-md sm:text-[9px]">
                  {formatProjectType(project.project_type)}
                </span>
                {project.project_date ? (
                  <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest text-white/65 backdrop-blur-md sm:text-[9px]">
                    {project.project_date}
                  </span>
                ) : null}
              </div>

              <h3 className="mt-2 line-clamp-2 text-lg font-black tracking-[-0.05em] text-white sm:text-2xl lg:text-3xl">
                {project.title}
              </h3>

              <p className="mt-1.5 line-clamp-2 max-w-xl text-[11px] leading-5 text-white/75 sm:text-xs sm:leading-6">
                {project.summary}
              </p>

              <div className="mt-4">
                {project.project_url ? (
                  <a
                    href={project.project_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="primary-btn inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[9px] font-black uppercase tracking-widest text-white sm:h-11 sm:px-5 sm:text-[10px]"
                  >
                    View project
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <span className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-[9px] font-black uppercase tracking-widest text-white/70 backdrop-blur-md sm:h-11 sm:px-5 sm:text-[10px]">
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

// ---------------------------------------------------------------------------
// Shared image + fallback
// ---------------------------------------------------------------------------

function ProjectPreviewImage({
  project,
  projectIndex,
  priority = false,
}: {
  project: PublicProject;
  projectIndex: number;
  priority?: boolean;
}) {
  if (!project.image_url)
    return <ProjectFallback projectIndex={projectIndex} />;

  return (
    <Image
      src={project.image_url}
      alt={project.title}
      fill
      priority={priority}
      draggable={false}
      sizes="(min-width: 1536px) 64rem, (min-width: 1280px) 60rem, (min-width: 640px) 74vw, 88vw"
      className="pointer-events-none object-contain p-2 sm:p-5 lg:p-6"
    />
  );
}

function ProjectFallback({ projectIndex }: { projectIndex: number }) {
  return (
    <div
      className={`absolute inset-0 ${backgrounds[projectIndex % backgrounds.length]}`}
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function matchesServiceFilter(project: PublicProject, filter: ServiceFilter) {
  if (filter.key === "all") return true;
  const text = [
    project.category,
    project.project_type,
    project.title,
    project.summary,
    project.project_date,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return filter.keywords.some((kw) => text.includes(kw));
}

function formatProjectType(value: string | null | undefined) {
  if (!value) return "Featured";
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

/** Extract a clean embed URL from a YouTube or Vimeo link */
function getVideoEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return null;
}
