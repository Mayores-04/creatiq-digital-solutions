"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { syncFacebookMessengerHistory } from "@/app/admin/actions";

export function FacebookHistorySyncButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function sync() {
    setBusy(true);
    const result = await syncFacebookMessengerHistory();
    setBusy(false);

    if (!result.ok) {
      toast.error("Couldn’t sync Messenger history", {
        description: result.error,
      });
      return;
    }

    toast.success("Messenger history synced", {
      description: result.message,
    });
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={sync}
      disabled={busy}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 text-[10px] font-black uppercase tracking-widest text-secondary transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
      {busy ? "Syncing..." : "Sync history"}
    </button>
  );
}
