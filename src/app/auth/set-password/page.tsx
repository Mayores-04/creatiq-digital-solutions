"use client";

import { type FormEvent, useEffect, useState } from "react";
import { AlertCircle, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function SetPasswordPage() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");
  const [message, setMessage] = useState("Checking your invitation link...");

  useEffect(() => {
    let active = true;

    async function prepareSession() {
      const supabase = createSupabaseBrowserClient();
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const errorDescription =
        hashParams.get("error_description") ??
        url.searchParams.get("error_description") ??
        hashParams.get("error") ??
        url.searchParams.get("error");

      try {
        if (errorDescription) throw new Error(errorDescription.replaceAll("+", " "));

        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const code = url.searchParams.get("code");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            const { data } = await supabase.auth.getSession();
            if (!data.session) throw error;
          }
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error("This setup link is invalid or expired. Ask an Admin to send a fresh invite.");

        window.history.replaceState(null, "", "/auth/set-password");
        if (!active) return;
        setStatus("ready");
        setMessage("Create a secure password to finish your CRM access.");
      } catch (error) {
        if (!active) return;
        setStatus("invalid");
        setMessage(error instanceof Error ? error.message : "This setup link is invalid or expired.");
      }
    }

    prepareSession();
    return () => {
      active = false;
    };
  }, []);

  async function setPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const password = String(values.get("password") ?? "");
    const confirmPassword = String(values.get("confirmPassword") ?? "");

    if (password.length < 8) {
      toast.error("Choose a longer password", { description: "Use at least 8 characters." });
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("This setup link is no longer valid. Ask an Admin to send a fresh one.");

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast.success("Password created. Welcome to Creatiq CRM.");
      window.location.assign("/admin");
    } catch (error) {
      toast.error("Could not create password", { description: error instanceof Error ? error.message : "Please request a fresh setup link." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(8,189,255,0.15),transparent_32rem),#020b1f] px-4">
      <form onSubmit={setPassword} className="glass-card w-full max-w-md rounded-3xl p-6 sm:p-8">
        <span className="inline-flex rounded-xl bg-cyan-300/10 p-3 text-secondary">
          {status === "invalid" ? <AlertCircle size={22} /> : <KeyRound size={22} />}
        </span>
        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">Creatiq CRM invitation</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-primary">
          {status === "invalid" ? "Invite link needs a refresh" : "Create your password"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">{message}</p>

        {status === "ready" ? (
          <>
            <div className="mt-7 space-y-4">
              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-secondary">New password</span>
                <input required minLength={8} name="password" type="password" autoComplete="new-password" className="h-12 w-full rounded-xl border border-cyan-300/15 bg-background/60 px-4 text-sm text-primary outline-none focus:border-secondary" />
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-secondary">Confirm password</span>
                <input required minLength={8} name="confirmPassword" type="password" autoComplete="new-password" className="h-12 w-full rounded-xl border border-cyan-300/15 bg-background/60 px-4 text-sm text-primary outline-none focus:border-secondary" />
              </label>
            </div>
            <button disabled={busy} className="primary-btn mt-7 flex h-12 w-full items-center justify-center rounded-xl text-xs font-black uppercase tracking-widest text-white disabled:opacity-60">
              {busy ? "Saving..." : "Create password"}
            </button>
          </>
        ) : null}

        {status === "invalid" ? (
          <a href="/admin/login" className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-xl border border-cyan-300/20 text-xs font-black uppercase tracking-widest text-secondary transition hover:border-secondary hover:bg-cyan-300/10">
            Back to login
          </a>
        ) : null}
      </form>
    </main>
  );
}
