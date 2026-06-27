"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import {
  Activity,
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  Shield,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import type { AdminIdentity } from "@/lib/crm/auth";

export type AdminNotification = {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
};

export function AdminHeader({
  identity,
  notifications,
  signOutAction,
}: {
  identity: AdminIdentity;
  notifications: AdminNotification[];
  signOutAction: () => Promise<void>;
}) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) return;

      const clickedInsideNotifications =
        notificationsRef.current?.contains(target) ?? false;

      const clickedInsideMenu = menuRef.current?.contains(target) ?? false;

      if (!clickedInsideNotifications) {
        setNotificationsOpen(false);
      }

      if (!clickedInsideMenu) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        setMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function openMobileSidebar() {
    window.dispatchEvent(new Event("creatiq-admin-sidebar-open"));
  }

  return (
    <header className="relative z-20 flex h-16 shrink-0 items-center justify-between gap-2 overflow-visible border-b border-cyan-300/15 bg-surface/90 px-3 backdrop-blur-xl sm:px-5 lg:h-[4.5rem] lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          onClick={openMobileSidebar}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.04] text-secondary transition hover:border-cyan-300/40 hover:bg-cyan-300/10 lg:hidden"
          aria-label="Open admin sidebar"
          aria-controls="admin-mobile-sidebar"
        >
          <Menu size={21} />
        </button>

        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="truncate text-sm font-black text-primary sm:text-base">
            {identity.fullName}
          </p>

          <p className="truncate text-[9px] font-black uppercase tracking-[0.18em] text-secondary sm:text-[10px]">
            {identity.role}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div ref={notificationsRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen((open) => !open);
              setMenuOpen(false);
            }}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.03] text-muted transition hover:border-secondary hover:bg-cyan-300/10 hover:text-secondary"
            aria-label="Open notifications"
            aria-expanded={notificationsOpen}
          >
            <Bell size={17} />

            {notifications.length ? (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-secondary shadow-[0_0_12px_rgba(8,189,255,0.9)]" />
            ) : null}
          </button>

          {notificationsOpen ? (
            <div className="fixed inset-x-3 top-[4.75rem] z-50 overflow-hidden rounded-2xl border border-cyan-300/15 bg-[#061329] shadow-[0_24px_80px_rgba(0,0,0,0.38)] sm:absolute sm:inset-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[24rem]">
              <div className="flex items-center justify-between gap-4 border-b border-cyan-300/10 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
                    Activity Center
                  </p>

                  <p className="mt-0.5 truncate text-xs text-muted">
                    Latest CRM movement
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <Link
                    href="/admin/notifications#notification-settings"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-[10px] font-bold uppercase tracking-widest text-muted hover:text-secondary"
                  >
                    Settings
                  </Link>

                  <Link
                    href="/admin/notifications"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-[10px] font-bold uppercase tracking-widest text-secondary hover:text-primary"
                  >
                    See all
                  </Link>
                </div>
              </div>

              <div className="custom-scrollbar max-h-[24rem] overflow-y-auto">
                {notifications.length ? (
                  notifications.slice(0, 8).map((item) => (
                    <Link
                      key={item.id}
                      href="/admin/notifications"
                      onClick={() => setNotificationsOpen(false)}
                      className="flex gap-3 border-b border-cyan-300/10 p-4 text-left transition last:border-0 hover:bg-cyan-300/[0.05]"
                    >
                      <span className="mt-0.5 shrink-0 rounded-xl bg-cyan-300/10 p-2 text-secondary">
                        <Activity size={15} />
                      </span>

                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-primary">
                          {item.title}
                        </span>

                        <span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted">
                          {item.detail}
                        </span>

                        <span className="mt-1 block text-[10px] uppercase tracking-widest text-muted/70">
                          {formatTime(item.createdAt)}
                        </span>
                      </span>
                    </Link>
                  ))
                ) : (
                  <p className="p-6 text-center text-sm text-muted">
                    No notifications yet.
                  </p>
                )}
              </div>

            </div>
          ) : null}
        </div>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setMenuOpen((open) => !open);
              setNotificationsOpen(false);
            }}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.03] px-2.5 text-left transition hover:border-secondary hover:bg-cyan-300/10 sm:px-3"
            aria-label="Open user menu"
            aria-expanded={menuOpen}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-300/10 text-secondary">
              <UserRound size={15} />
            </span>

            <span className="hidden min-w-0 sm:block">
              <span className="block max-w-36 truncate text-xs font-bold text-primary">
                {identity.fullName}
              </span>

              <span className="block text-[9px] font-black uppercase tracking-widest text-secondary">
                {identity.role}
              </span>
            </span>

            <ChevronDown
              size={14}
              className={`shrink-0 text-muted transition ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {menuOpen ? (
            <div className="custom-scrollbar fixed inset-x-3 top-[4.75rem] z-50 max-h-[calc(100dvh-5.5rem)] overflow-y-auto rounded-2xl border border-cyan-300/15 bg-[#061329] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.38)] sm:absolute sm:inset-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-64">
              <div className="rounded-xl bg-cyan-300/[0.04] px-3 py-3">
                <p className="truncate text-sm font-bold text-primary">
                  {identity.fullName}
                </p>

                <p className="mt-1 truncate text-xs text-muted">
                  {identity.email}
                </p>
              </div>

              <MenuLink
                href="/admin/profile"
                icon={UserRound}
                label="Profile"
                onClick={() => setMenuOpen(false)}
              />

              {identity.role === "ADMIN" ? (
                <MenuLink
                  href="/admin/settings"
                  icon={Settings}
                  label="Company settings"
                  onClick={() => setMenuOpen(false)}
                />
              ) : null}

              {identity.role === "ADMIN" ? (
                <MenuLink
                  href="/admin/users"
                  icon={UsersRound}
                  label="User management"
                  onClick={() => setMenuOpen(false)}
                />
              ) : null}

              <MenuLink
                href="/admin/notifications"
                icon={Shield}
                label="Activity Center"
                onClick={() => setMenuOpen(false)}
              />

              <form
                action={signOutAction}
                className="mt-1 border-t border-cyan-300/10 pt-1"
              >
                <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-100 transition hover:bg-red-300/10">
                  <LogOut size={16} />
                  Sign out
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="mt-1 flex min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-cyan-300/10 hover:text-primary"
    >
      <Icon size={16} className="shrink-0" />
      <span className="min-w-0 truncate">{label}</span>
    </Link>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
