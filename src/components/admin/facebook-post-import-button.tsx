"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { importFacebookPostsToContentPlanner } from "@/app/admin/actions";

export function FacebookPostImportButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function importPosts() {
    setBusy(true);
    const result = await importFacebookPostsToContentPlanner();
    setBusy(false);

    if (!result.ok) {
      toast.error("Couldn’t import Facebook posts", {
        description: result.error,
      });
      return;
    }

    toast.success("Facebook posts synced", {
      description: result.message,
    });
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={importPosts}
      disabled={busy}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 text-[10px] font-black uppercase tracking-widest text-secondary transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <CalendarPlus size={14} />
      {busy ? "Importing..." : "Import to planner"}
    </button>
  );
}
