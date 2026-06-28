"use client";

import { type FormEvent, useState } from "react";
import { SendHorizonal } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { sendFacebookMessengerReply } from "@/app/admin/actions";

export function FacebookReplyComposer({
  psid,
  disabled = false,
}: {
  psid: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextMessage = message.trim();
    if (!nextMessage) return;

    setBusy(true);
    const result = await sendFacebookMessengerReply({
      psid,
      message: nextMessage,
    });
    setBusy(false);

    if (!result.ok) {
      toast.error("Couldn’t send Messenger reply", {
        description: result.error,
      });
      return;
    }

    setMessage("");
    toast.success(result.message);
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="shrink-0 border-t border-cyan-300/10 bg-surface/95 p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block min-w-0 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">
            Reply in Facebook Messenger
          </span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            disabled={disabled || busy}
            rows={2}
            maxLength={1800}
            placeholder="Type your reply..."
            className="mt-1.5 max-h-32 min-h-12 w-full resize-y rounded-xl border border-cyan-300/15 bg-background/60 px-3 py-2 text-sm leading-6 text-primary outline-none transition placeholder:text-muted/55 focus:border-secondary disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        <button
          disabled={disabled || busy || !message.trim()}
          className="primary-btn inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-[10px] font-black uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <SendHorizonal size={15} />
          {busy ? "Sending..." : "Send"}
        </button>
      </div>

      <p className="mt-2 text-[11px] leading-5 text-muted">
        Replies use your connected Facebook Page token. Meta may reject replies
        outside the allowed Messenger response window.
      </p>
    </form>
  );
}
