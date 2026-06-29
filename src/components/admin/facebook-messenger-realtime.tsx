"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Radio } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type RealtimeStatus = "connecting" | "live" | "offline";
type ChannelStatus = "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR";
const POLL_INTERVAL_MS = 2_500;
const FACEBOOK_GRAPH_SYNC_MS = 5_000;

export function FacebookMessengerRealtime() {
  const router = useRouter();
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastGraphSyncRef = useRef(0);
  const versionRef = useRef<string | null>(null);
  const realtimeLiveRef = useRef(false);
  const [status, setStatus] = useState<RealtimeStatus>("connecting");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let active = true;

    const refreshSoon = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => {
        router.refresh();
      }, 450);
    };

    const pollVersion = async () => {
      if (!active || document.visibilityState === "hidden") return;

      try {
        const now = Date.now();
        if (now - lastGraphSyncRef.current >= FACEBOOK_GRAPH_SYNC_MS) {
          lastGraphSyncRef.current = now;
          const syncResponse = await fetch("/api/admin/facebook/messages/sync", {
            method: "POST",
            cache: "no-store",
          });
          if (syncResponse.ok) {
            const syncPayload = (await syncResponse.json()) as {
              changed?: boolean;
            };
            if (syncPayload.changed) refreshSoon();
          }
        }

        const response = await fetch("/api/admin/facebook/messages/version", {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Unable to check latest messages.");

        const payload = (await response.json()) as { version?: string };
        if (!payload.version) return;

        if (!versionRef.current) {
          versionRef.current = payload.version;
          if (!realtimeLiveRef.current) setStatus("live");
          return;
        }

        if (payload.version !== versionRef.current) {
          versionRef.current = payload.version;
          if (!realtimeLiveRef.current) setStatus("live");
          refreshSoon();
        }
      } catch {
        if (!realtimeLiveRef.current) setStatus("offline");
      }
    };

    const channel = supabase
      .channel("facebook-messenger-inbox")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meta_webhook_events",
        },
        refreshSoon,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "facebook_conversations",
        },
        refreshSoon,
      )
      .subscribe((nextStatus: ChannelStatus) => {
        if (nextStatus === "SUBSCRIBED") {
          realtimeLiveRef.current = true;
          setStatus("live");
        }
        if (
          nextStatus === "CHANNEL_ERROR" ||
          nextStatus === "TIMED_OUT" ||
          nextStatus === "CLOSED"
        ) {
          realtimeLiveRef.current = false;
          setStatus("connecting");
        }
      });

    void pollVersion();
    const pollTimer = window.setInterval(() => {
      void pollVersion();
    }, POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void pollVersion();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(pollTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-widest ${
        status === "live"
          ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
          : status === "offline"
            ? "border-red-300/20 bg-red-500/10 text-red-200"
            : "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
      }`}
      title={
        status === "live"
          ? "New Messenger events will appear automatically."
          : status === "offline"
            ? "Auto-sync is disconnected. Check your admin session or network."
            : "Connecting to realtime and free polling fallback."
      }
    >
      <Radio size={12} className={status === "live" ? "animate-pulse" : ""} />
      {status === "live" ? "Live auto-sync" : status === "offline" ? "Offline" : "Connecting"}
    </span>
  );
}
