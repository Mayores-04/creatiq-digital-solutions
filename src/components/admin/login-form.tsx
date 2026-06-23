"use client";

import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AdminLoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      });

      if (error) throw error;
      window.location.assign("/admin");
    } catch (error) {
      toast.error("Unable to sign in", {
        description: error instanceof Error ? error.message : "Check your credentials and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={signIn} className="glass-card w-full max-w-md rounded-3xl p-6 sm:p-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">Creatiq CRM</p>
      <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-primary">Admin sign in</h1>
      <p className="mt-3 text-sm leading-6 text-muted">This workspace is restricted to invited Creatiq team members.</p>
      <div className="mt-7 space-y-4">
        <label className="block space-y-2"><span className="text-xs font-bold uppercase tracking-widest text-secondary">Email</span><input required name="email" type="email" autoComplete="email" className="h-12 w-full rounded-xl border border-cyan-300/15 bg-background/60 px-4 text-sm text-primary outline-none focus:border-secondary" /></label>
        <label className="block space-y-2"><span className="text-xs font-bold uppercase tracking-widest text-secondary">Password</span><input required name="password" type="password" autoComplete="current-password" className="h-12 w-full rounded-xl border border-cyan-300/15 bg-background/60 px-4 text-sm text-primary outline-none focus:border-secondary" /></label>
      </div>
      <button disabled={isSubmitting} className="primary-btn mt-7 flex h-12 w-full items-center justify-center rounded-xl text-xs font-black uppercase tracking-widest text-white disabled:opacity-60">{isSubmitting ? "Signing in..." : "Sign in"}</button>
    </form>
  );
}
