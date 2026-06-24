"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Activity,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  MessageSquareQuote,
  Settings,
  Users,
  UserRoundCog,
} from "lucide-react";

import type { AdminRole } from "@/lib/crm/constants";
import { brand } from "@/components/site/brand";

const links = [
  {
    href: "/admin",
    label: "Overview",
    icon: LayoutDashboard,
    group: "Workspace",
  },
  {
    href: "/admin/inquiries",
    label: "Inquiries",
    icon: Inbox,
    group: "Workspace",
  },
  {
    href: "/admin/clients",
    label: "Clients",
    icon: Building2,
    group: "Workspace",
    adminOnly: true,
  },
  {
    href: "/admin/projects",
    label: "Projects",
    icon: FolderKanban,
    group: "Delivery",
  },
  {
    href: "/admin/tasks",
    label: "Tasks",
    icon: BriefcaseBusiness,
    group: "Delivery",
  },
  {
    href: "/admin/employees",
    label: "Employees",
    icon: Users,
    group: "Delivery",
  },
  {
    href: "/admin/reviews",
    label: "Customer Reviews",
    icon: MessageSquareQuote,
    group: "Growth",
    adminOnly: true,
  },
  {
    href: "/admin/services",
    label: "Services",
    icon: Activity,
    group: "Growth",
    adminOnly: true,
  },
  {
    href: "/admin/reports",
    label: "Reports",
    icon: BarChart3,
    group: "Growth",
  },
  {
    href: "/admin/notifications",
    label: "Activity Center",
    icon: Bell,
    group: "System",
  },
  {
    href: "/admin/settings",
    label: "Company Settings",
    icon: Settings,
    group: "System",
    adminOnly: true,
  },
  {
    href: "/admin/users",
    label: "User Management",
    icon: UserRoundCog,
    group: "System",
    adminOnly: true,
  },
];

const groups = ["Workspace", "Delivery", "Growth", "System"] as const;

export function AdminSidebar({ role }: { role: AdminRole }) {
  const pathname = usePathname();

  const visibleLinks = links.filter(
    (link) => !link.adminOnly || role === "ADMIN",
  );

  return (
    <aside className="shrink-0 border-b border-cyan-300/15 bg-[#061329]/95 p-3 backdrop-blur-xl lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:h-dvh lg:w-72 lg:flex-col lg:overflow-hidden lg:border-b-0 lg:border-r lg:p-5">
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

        <span className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-secondary">
          CRM
        </span>
      </Link>

      <nav
        className="custom-scrollbar mt-3 flex flex-col gap-4 pb-1 lg:mt-6 lg:min-h-0 lg:flex-1 lg:gap-0 lg:space-y-5 lg:overflow-y-auto lg:pr-1"
        aria-label="Admin navigation"
      >
        {groups.map((group) => {
          const groupLinks = visibleLinks.filter(
            (link) => link.group === group,
          );

          if (!groupLinks.length) return null;

          return (
            <div
              key={group}
              className="flex shrink-0 flex-col gap-1 lg:block lg:space-y-1"
            >
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
                    className={`inline-flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      isActive
                        ? "bg-gradient-to-r from-cyan-300/18 to-blue-500/10 text-secondary shadow-[inset_0_0_0_1px_rgba(8,189,255,.18)]"
                        : "text-muted hover:bg-cyan-300/8 hover:text-primary"
                    }`}
                  >
                    <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="mt-4 hidden shrink-0 rounded-2xl border border-cyan-300/10 bg-background/30 p-3 lg:block">
        <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">
          {role === "ADMIN" ? "Admin access" : "Staff access"}
        </p>

        <p className="mt-1 text-xs leading-5 text-muted">
          {role === "ADMIN"
            ? "Configure the studio, publishing, and people."
            : "Keep your assigned delivery work moving."}
        </p>
      </div>
    </aside>
  );
}
