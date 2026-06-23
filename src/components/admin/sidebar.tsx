"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  FileText,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  Settings,
  Users,
  UserRoundCog,
} from "lucide-react";
import type { AdminRole } from "@/lib/crm/constants";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/inquiries", label: "Inquiries", icon: Inbox },
  { href: "/admin/clients", label: "Clients", icon: Building2, ownerOnly: true },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/tasks", label: "Tasks", icon: BriefcaseBusiness },
  { href: "/admin/employees", label: "Employees", icon: Users },
  { href: "/admin/portfolio", label: "Portfolio", icon: FileText, ownerOnly: true },
  { href: "/admin/services", label: "Services", icon: Activity, ownerOnly: true },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/activity", label: "Activity", icon: Activity },
  { href: "/admin/settings", label: "Company Settings", icon: Settings, ownerOnly: true },
  { href: "/admin/users", label: "User Management", icon: UserRoundCog, ownerOnly: true },
];

export function AdminSidebar({ role }: { role: AdminRole }) {
  const pathname = usePathname();

  return (
    <aside className="border-b border-cyan-300/15 bg-surface/90 p-3 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r lg:p-5">
      <Link href="/" className="mb-5 inline-flex items-center gap-2 px-2 text-sm font-black tracking-[-0.03em] text-primary">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-background">C</span>
        Creatiq Admin
      </Link>
      <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible" aria-label="Admin navigation">
        {links.filter((link) => !link.ownerOnly || role === "OWNER").map(({ href, label, icon: Icon }) => {
          const isActive = href === "/admin" ? pathname === href : pathname.startsWith(href);

          return (
            <Link key={href} href={href} className={`inline-flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? "bg-cyan-300/15 text-secondary" : "text-muted hover:bg-cyan-300/10 hover:text-secondary"}`}>
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
