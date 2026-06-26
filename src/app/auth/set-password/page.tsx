"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { AlertCircle, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type PageStatus = "checking" | "ready" | "invalid";

type SupabaseLikeError = Error & {
  status?: number;
  code?: string;
};

const INVITE_PROCESSING_KEY = "creatiq-invite-processing";

function hasRateLimitError(error: unknown) {
  const authError = error as SupabaseLikeError;

  return (
    authError.status === 429 || authError.code === "over_request_rate_limit"
  );
}

function getCleanSetPasswordUrl() {
  return `${window.location.origin}/auth/set-password`;
}

export default function SetPasswordPage() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<PageStatus>("checking");
  const [message, setMessage] = useState("Checking your invitation link...");

  const prepareLockRef = useRef(false);
  const submitLockRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function prepareSession() {
      if (prepareLockRef.current) return;

      prepareLockRef.current = true;

      const currentUrl = window.location.href;
      const storageLock = window.sessionStorage.getItem(INVITE_PROCESSING_KEY);

      if (storageLock === currentUrl) {
        return;
      }

      window.sessionStorage.setItem(INVITE_PROCESSING_KEY, currentUrl);

      const supabase = createSupabaseBrowserClient();
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(
        window.location.hash.replace(/^#/, ""),
      );

      const errorDescription =
        hashParams.get("error_description") ??
        url.searchParams.get("error_description") ??
        hashParams.get("error") ??
        url.searchParams.get("error");

      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const code = url.searchParams.get("code");

      try {
        if (errorDescription) {
          throw new Error(errorDescription.replaceAll("+", " "));
        }

        /**
         * Important:
         * Clean the URL early after reading the token/code.
         * This prevents React Strict Mode / reload / duplicate mount
         * from processing the same invite link again and again.
         */
        if (accessToken || refreshToken || code) {
          window.history.replaceState(null, "", getCleanSetPasswordUrl());
        }

        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;

          if (!data.session?.user) {
            throw new Error(
              "This setup link is invalid or expired. Ask an Admin to send a fresh invite.",
            );
          }
        } else if (code) {
          const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) throw error;

          if (!data.session?.user) {
            throw new Error(
              "This setup link is invalid or expired. Ask an Admin to send a fresh invite.",
            );
          }
        } else {
          /**
           * No token/code in URL.
           * Check local session only. This should not spam auth endpoints.
           */
          const { data } = await supabase.auth.getSession();

          if (!data.session?.user) {
            throw new Error(
              "This setup link is invalid or expired. Ask an Admin to send a fresh invite.",
            );
          }
        }

        if (!active) return;

        setStatus("ready");
        setMessage("Create a secure password to finish your CRM access.");
      } catch (error) {
        if (!active) return;

        setStatus("invalid");

        if (hasRateLimitError(error)) {
          setMessage(
            "Too many authentication requests were made. Please wait a few minutes, then open the invite link again.",
          );
        } else {
          setMessage(
            error instanceof Error
              ? error.message
              : "This setup link is invalid or expired.",
          );
        }
      } finally {
        window.sessionStorage.removeItem(INVITE_PROCESSING_KEY);
      }
    }

    prepareSession();

    return () => {
      active = false;
    };
  }, []);

  async function setPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitLockRef.current || busy) return;

    submitLockRef.current = true;
    setBusy(true);

    let shouldUnlock = true;

    try {
      const form = event.currentTarget;
      const values = new FormData(form);

      const password = String(values.get("password") ?? "");
      const confirmPassword = String(values.get("confirmPassword") ?? "");

      if (password.length < 8) {
        toast.error("Choose a longer password", {
          description: "Use at least 8 characters.",
        });
        return;
      }

      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      const supabase = createSupabaseBrowserClient();

      /**
       * No need to call getUser() again here.
       * updateUser will fail if there is no valid session.
       * This avoids one extra Supabase Auth request.
       */
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      toast.success("Password created. Welcome to Creatiq CRM.");

      shouldUnlock = false;
      window.location.replace("/admin");
    } catch (error) {
      if (hasRateLimitError(error)) {
        toast.error("Too many requests", {
          description:
            "Please wait a few minutes before trying again. Supabase temporarily blocked repeated auth requests.",
        });
      } else {
        toast.error("Could not create password", {
          description:
            error instanceof Error
              ? error.message
              : "Please request a fresh setup link.",
        });
      }
    } finally {
      if (shouldUnlock) {
        submitLockRef.current = false;
        setBusy(false);
      }
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(8,189,255,0.15),transparent_32rem),#020b1f] px-4">
      <form
        onSubmit={setPassword}
        className="glass-card w-full max-w-md rounded-3xl p-6 sm:p-8"
      >
        <span className="inline-flex rounded-xl bg-cyan-300/10 p-3 text-secondary">
          {status === "invalid" ? (
            <AlertCircle size={22} />
          ) : (
            <KeyRound size={22} />
          )}
        </span>

        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
          Creatiq CRM invitation
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-primary">
          {status === "invalid"
            ? "Invite link needs a refresh"
            : "Create your password"}
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted">{message}</p>

        {status === "ready" ? (
          <>
            <div className="mt-7 space-y-4">
              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-secondary">
                  New password
                </span>

                <input
                  required
                  minLength={8}
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  disabled={busy}
                  className="h-12 w-full rounded-xl border border-cyan-300/15 bg-background/60 px-4 text-sm text-primary outline-none focus:border-secondary disabled:cursor-not-allowed disabled:opacity-70"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-secondary">
                  Confirm password
                </span>

                <input
                  required
                  minLength={8}
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  disabled={busy}
                  className="h-12 w-full rounded-xl border border-cyan-300/15 bg-background/60 px-4 text-sm text-primary outline-none focus:border-secondary disabled:cursor-not-allowed disabled:opacity-70"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={busy}
              aria-busy={busy}
              className="primary-btn mt-7 flex h-12 w-full items-center justify-center rounded-xl text-xs font-black uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Saving..." : "Create password"}
            </button>
          </>
        ) : null}

        {status === "invalid" ? (
          <a
            href="/admin/login"
            className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-xl border border-cyan-300/20 text-xs font-black uppercase tracking-widest text-secondary transition hover:border-secondary hover:bg-cyan-300/10"
          >
            Back to login
          </a>
        ) : null}
      </form>
    </main>
  );
}
