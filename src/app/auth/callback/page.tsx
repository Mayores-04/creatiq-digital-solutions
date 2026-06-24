"use client";

import { useEffect } from "react";

export default function AuthCallbackPage() {
  useEffect(() => {
    const destination = new URL("/auth/set-password", window.location.origin);
    destination.search = window.location.search;
    destination.hash = window.location.hash;
    window.location.replace(destination.toString());
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(8,189,255,0.15),transparent_32rem),#020b1f] px-4 text-center">
      <section className="glass-card w-full max-w-md rounded-3xl p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">Creatiq CRM invitation</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-primary">Preparing your access...</h1>
        <p className="mt-3 text-sm leading-6 text-muted">Hang tight, we are opening your password setup screen.</p>
      </section>
    </main>
  );
}
