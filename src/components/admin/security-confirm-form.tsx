"use client";

import { type FormEvent, useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { confirmAdminSecurityRequest } from "@/app/admin/actions";

export function SecurityConfirmForm({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true);
    const result = await confirmAdminSecurityRequest(
      token,
      String(values.get("password") ?? ""),
    );
    setBusy(false);

    if (!result.ok) {
      toast.error("Could not confirm request", { description: result.error });
      return;
    }

    setConfirmed(true);
    toast.success(result.message);
  }

  return (
    <form
      onSubmit={submit}
      className="glass-card w-full max-w-md rounded-3xl p-6 sm:p-8"
    >
      <span className="inline-flex rounded-xl bg-cyan-300/10 p-3 text-secondary">
        {confirmed ? <ShieldCheck size={22} /> : <KeyRound size={22} />}
      </span>

      <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
        Creatiq CRM security
      </p>

      <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-primary">
        {confirmed ? "Request confirmed" : "Confirm admin access change"}
      </h1>

      <p className="mt-3 text-sm leading-6 text-muted">
        {confirmed
          ? "The requested Admin access change has been applied. You may now close this page."
          : "For your protection, enter your own password before this Admin-level access change is applied."}
      </p>

      {!confirmed ? (
        <>
          <label className="mt-7 block space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-secondary">
              Your password
            </span>
            <input
              required
              name="password"
              type="password"
              autoComplete="current-password"
              disabled={busy}
              className="h-12 w-full rounded-xl border border-cyan-300/15 bg-background/60 px-4 text-sm text-primary outline-none focus:border-secondary disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="primary-btn mt-7 flex h-12 w-full items-center justify-center rounded-xl text-xs font-black uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Confirming..." : "Confirm access change"}
          </button>
        </>
      ) : (
        <a
          href="/admin/login"
          className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-xl border border-cyan-300/20 text-xs font-black uppercase tracking-widest text-secondary transition hover:border-secondary hover:bg-cyan-300/10"
        >
          Back to login
        </a>
      )}
    </form>
  );
}
