"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const ADMIN_SYNC_INTERVAL_MS = 4_000;
const SKIP_PATHS = ["/admin/login", "/auth/set-password"];

export function AdminLiveSync() {
  const router = useRouter();
  const pathname = usePathname();
  const versionRef = useRef<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (SKIP_PATHS.some((path) => pathname?.startsWith(path))) return;

    let active = true;

    const refreshSoon = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => router.refresh(), 350);
    };

    const checkVersion = async () => {
      if (!active || document.visibilityState === "hidden") return;

      try {
        const response = await fetch("/api/admin/realtime/version", {
          cache: "no-store",
        });
        if (!response.ok) return;

        const payload = (await response.json()) as { version?: string };
        if (!payload.version) return;

        if (!versionRef.current) {
          versionRef.current = payload.version;
          return;
        }

        if (payload.version !== versionRef.current) {
          versionRef.current = payload.version;
          refreshSoon();
        }
      } catch {
        // Keep this quiet. The page should not feel broken just because a
        // background auto-sync pulse missed one network request.
      }
    };

    void checkVersion();
    const interval = window.setInterval(() => {
      void checkVersion();
    }, ADMIN_SYNC_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void checkVersion();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [pathname, router]);

  return null;
}
