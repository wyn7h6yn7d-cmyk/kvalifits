"use client";

import type { ReactNode } from "react";
import { useSelectedLayoutSegments } from "next/navigation";

import { cn } from "@/lib/utils";

type Props = {
  navbar: ReactNode;
  footer: ReactNode;
  children: ReactNode;
};

export function PublicSiteMain({ navbar, footer, children }: Props) {
  const segments = useSelectedLayoutSegments();
  const isHome = segments.length === 0;

  return (
    <div className={cn("flex-1", isHome ? "relative bg-surface" : "bg-background")}>
      {navbar}
      <main
        className={cn(
          isHome ? "relative z-0" : "pt-[var(--site-header-offset)]",
          "pb-[var(--site-bottom-nav-offset)]",
        )}
      >
        {children}
      </main>
      {footer}
    </div>
  );
}
