"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  FolderKanban,
  Images,
  Inbox,
  LayoutDashboard,
  MessagesSquare,
  MessageSquareQuote,
  Settings,
  Users,
  UserRoundCog,
  X,
} from "lucide-react";

import type { AdminModuleKey, AdminRole } from "@/lib/crm/constants";
import { brand } from "@/components/site/brand";

const links = [
  {
    href: "/admin",
    label: "Overview",
    icon: LayoutDashboard,
    group: "Workspace",
    module: "overview",
  },
  {
    href: "/admin/inquiries",
    label: "Inquiries",
    icon: Inbox,
    group: "Workspace",
    module: "inquiries",
  },
  {
    href: "/admin/clients",
    label: "Clients",
    icon: Building2,
    group: "Workspace",
    adminOnly: true,
    module: "clients",
  },
  {
    href: "/admin/projects",
    label: "Projects",
    icon: FolderKanban,
    group: "Delivery",
    module: "projects",
  },
  {
    href: "/admin/tasks",
    label: "Tasks",
    icon: BriefcaseBusiness,
    group: "Delivery",
    module: "tasks",
  },
  {
    href: "/admin/employees",
    label: "Employees",
    icon: Users,
    group: "Delivery",
    module: "employees",
  },
  {
    href: "/admin/content-planner",
    label: "Content Planner",
    icon: CalendarDays,
    group: "Growth",
    module: "content-planner",
  },
  // {
  //   href: "/admin/facebook/posts",
  //   label: "Page Uploads",
  //   icon: Images,
  //   group: "Growth",
  //   module: "facebook",
  // },
  // {
  //   href: "/admin/facebook/messages",
  //   label: "Messenger Inbox",
  //   icon: MessagesSquare,
  //   group: "Growth",
  //   module: "facebook",
  // },
  {
    href: "/admin/reviews",
    label: "Customer Reviews",
    icon: MessageSquareQuote,
    group: "Growth",
    adminOnly: true,
    module: "customer-reviews",
  },
  {
    href: "/admin/services",
    label: "Services",
    icon: Activity,
    group: "Growth",
    adminOnly: true,
    module: "services",
  },
  {
    href: "/admin/reports",
    label: "Reports",
    icon: BarChart3,
    group: "Growth",
    module: "reports",
  },
  {
    href: "/admin/notifications",
    label: "Activity Center",
    icon: Bell,
    group: "System",
    module: "notifications",
  },
  {
    href: "/admin/settings",
    label: "Company Settings",
    icon: Settings,
    group: "System",
    adminOnly: true,
    module: "settings",
  },
  {
    href: "/admin/users",
    label: "User Management",
    icon: UserRoundCog,
    group: "System",
    adminOnly: true,
    module: "users",
  },
];

const groups = ["Workspace", "Delivery", "Growth", "System"] as const;

type SidebarLink = (typeof links)[number];

export function AdminSidebar({
  role,
  permissions,
}: {
  role: AdminRole;
  permissions: AdminModuleKey[];
}) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const visibleLinks = useMemo(() => {
    return links.filter(
      (link) =>
        (!link.adminOnly || role === "ADMIN") &&
        (role === "ADMIN" ||
          permissions.includes(link.module as AdminModuleKey)),
    );
  }, [permissions, role]);

  useEffect(() => {
    function openSidebar() {
      setIsMobileOpen(true);
    }

    window.addEventListener("creatiq-admin-sidebar-open", openSidebar);

    return () => {
      window.removeEventListener("creatiq-admin-sidebar-open", openSidebar);
    };
  }, []);

  useEffect(() => {
    if (!isMobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileOpen]);

  function closeMobileMenu() {
    setIsMobileOpen(false);
  }

  return (
    <>
      {isMobileOpen ? (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button
            type="button"
            aria-label="Close admin menu overlay"
            onClick={closeMobileMenu}
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
          />

          <aside
            id="admin-mobile-sidebar"
            role="dialog"
            aria-modal="true"
            className="custom-scrollbar absolute inset-y-0 left-0 z-10 flex w-[min(22rem,88vw)] max-w-full flex-col overflow-y-auto border-r border-cyan-300/15 bg-[#061329] p-4 shadow-[0_0_60px_rgba(8,189,255,0.16)]"
          >
            <div className="flex shrink-0 items-center justify-between gap-3">
              <Link
                href="/"
                onClick={closeMobileMenu}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.035] p-3 transition hover:border-cyan-300/30"
              >
                <Image
                  src={brand.landscape}
                  alt="Creatiq Digital Solutions"
                  width={210}
                  height={72}
                  className="h-10 w-auto max-w-[11rem] object-contain"
                  priority
                />

                <span className="hidden shrink-0 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-secondary sm:inline-flex">
                  CRM
                </span>
              </Link>

              <button
                type="button"
                onClick={closeMobileMenu}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-secondary transition hover:border-cyan-300/40 hover:bg-cyan-300/15"
                aria-label="Close admin menu"
              >
                <X size={22} />
              </button>
            </div>

            <SidebarNavigation
              visibleLinks={visibleLinks}
              pathname={pathname}
              onNavigate={closeMobileMenu}
              variant="mobile"
            />

            <AccessCard role={role} />
          </aside>
        </div>
      ) : null}

      <aside className="hidden shrink-0 border-cyan-300/15 bg-[#061329]/95 backdrop-blur-xl lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:h-dvh lg:w-72 lg:flex-col lg:overflow-hidden lg:border-r lg:p-5">
        <Link
          href="/"
          className="flex shrink-0 items-center justify-between gap-3 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.035] p-3 transition hover:border-cyan-300/30"
        >
          <Image
            src={brand.landscape}
            alt="Creatiq Digital Solutions"
            width={220}
            height={76}
            className="h-10 w-auto object-contain"
            priority
          />

          <span className="shrink-0 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-secondary">
            CRM
          </span>
        </Link>

        <SidebarNavigation
          visibleLinks={visibleLinks}
          pathname={pathname}
          variant="desktop"
        />

        <AccessCard role={role} />
      </aside>
    </>
  );
}

function SidebarNavigation({
  visibleLinks,
  pathname,
  onNavigate,
  variant,
}: {
  visibleLinks: SidebarLink[];
  pathname: string;
  onNavigate?: () => void;
  variant: "desktop" | "mobile";
}) {
  return (
    <nav
      className={
        variant === "desktop"
          ? "custom-scrollbar mt-6 min-h-0 flex-1 space-y-5 overflow-y-auto pr-1"
          : "mt-6 min-h-0 flex-1 space-y-5 pb-4"
      }
      aria-label="Admin navigation"
    >
      {groups.map((group) => {
        const groupLinks = visibleLinks.filter((link) => link.group === group);

        if (!groupLinks.length) return null;

        return (
          <div key={group} className="space-y-1">
            <p className="px-3 pb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-muted/65">
              {group}
            </p>

            {groupLinks.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === "/admin"
                  ? pathname === href
                  : pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  className={`flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-300/[0.18] to-blue-500/[0.10] text-secondary shadow-[inset_0_0_0_1px_rgba(8,189,255,.18)]"
                      : "text-muted hover:bg-cyan-300/[0.08] hover:text-primary"
                  }`}
                >
                  <Icon
                    size={17}
                    strokeWidth={isActive ? 2.5 : 2}
                    className="shrink-0"
                  />

                  <span className="min-w-0 truncate">{label}</span>
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

function AccessCard({ role }: { role: AdminRole }) {
  return (
    <div className="mt-4 shrink-0 rounded-2xl border border-cyan-300/10 bg-background/30 p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">
        {role === "ADMIN" ? "Admin access" : "Staff access"}
      </p>

      <p className="mt-1 text-xs leading-5 text-muted">
        {role === "ADMIN"
          ? "Configure the studio, publishing, and people."
          : "Keep your assigned delivery work moving."}
      </p>
    </div>
  );
}
