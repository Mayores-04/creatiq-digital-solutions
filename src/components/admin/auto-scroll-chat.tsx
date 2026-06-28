"use client";

import { type ReactNode, useEffect, useRef } from "react";

export function AutoScrollChat({ children }: { children: ReactNode }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  });

  return (
    <>
      {children}
      <div ref={bottomRef} aria-hidden="true" />
    </>
  );
}
