"use client";

import { type FormEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type SupabaseLikeError = Error & {
  status?: number;
  code?: string;
};

export function AdminLoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hard lock para kahit double click / enter spam, isang request lang talaga.
  const submitLockRef = useRef(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitLockRef.current || isSubmitting) return;

    submitLockRef.current = true;
    setIsSubmitting(true);

    let shouldUnlock = true;

    try {
      const formData = new FormData(event.currentTarget);

      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");

      if (!email || !password) {
        toast.error("Missing email or password");
        return;
      }

      const supabase = createSupabaseBrowserClient();

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Do not unlock after success. Let the page navigate.
      shouldUnlock = false;
      window.location.replace("/admin");
    } catch (error) {
      const authError = error as SupabaseLikeError;

      if (
        authError.status === 429 ||
        authError.code === "over_request_rate_limit"
      ) {
        toast.error("Too many sign-in attempts", {
          description:
            "Please wait a few minutes before trying again. Supabase temporarily blocked repeated auth requests.",
        });
      } else {
        toast.error("Unable to sign in", {
          description:
            error instanceof Error
              ? error.message
              : "Check your credentials and try again.",
        });
      }
    } finally {
      // Only unlock if login failed or validation failed.
      // Kapag success, wag na i-enable ulit habang nagna-navigate.
      if (shouldUnlock) {
        submitLockRef.current = false;
        setIsSubmitting(false);
      }
    }
  }

  return (
    <form
      onSubmit={signIn}
      className="glass-card w-full max-w-md rounded-3xl p-6 sm:p-8"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
        Creatiq CRM
      </p>

      <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-primary">
        Admin sign in
      </h1>

      <p className="mt-3 text-sm leading-6 text-muted">
        This workspace is restricted to invited Creatiq team members.
      </p>

      <div className="mt-7 space-y-4">
        <label className="block space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-secondary">
            Email
          </span>

          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            disabled={isSubmitting}
            className="h-12 w-full rounded-xl border border-cyan-300/15 bg-background/60 px-4 text-sm text-primary outline-none focus:border-secondary disabled:cursor-not-allowed disabled:opacity-70"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-secondary">
            Password
          </span>

          <input
            required
            name="password"
            type="password"
            autoComplete="current-password"
            disabled={isSubmitting}
            className="h-12 w-full rounded-xl border border-cyan-300/15 bg-background/60 px-4 text-sm text-primary outline-none focus:border-secondary disabled:cursor-not-allowed disabled:opacity-70"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="primary-btn mt-7 flex h-12 w-full items-center justify-center rounded-xl text-xs font-black uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
