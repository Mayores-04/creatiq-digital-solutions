"use client";

import { useEffect } from "react";

function hasSupabaseAuthPayload() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);

  return Boolean(
    hashParams.get("access_token") ||
      hashParams.get("refresh_token") ||
      hashParams.get("error") ||
      searchParams.get("code") ||
      searchParams.get("error"),
  );
}

export function AuthInviteBridge() {
  useEffect(() => {
    if (window.location.pathname.startsWith("/auth/")) return;
    if (!hasSupabaseAuthPayload()) return;

    const destination = new URL("/auth/set-password", window.location.origin);
    destination.search = window.location.search;
    destination.hash = window.location.hash;
    window.location.replace(destination.toString());
  }, []);

  return null;
}
