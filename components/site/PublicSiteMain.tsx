"use client";

import type { ReactNode } from "react";
import { useSelectedLayoutSegments } from "next/navigation";

import { cn } from "@/lib/utils";

type Props = {
  navbar: ReactNode;
  children: ReactNode;
  jobsFooter: ReactNode;
  defaultFooter: ReactNode;
};

export function PublicSiteMain({ navbar, children, jobsFooter, defaultFooter }: Props) {
  const segments = useSelectedLayoutSegments();
  const isHome = segments.length === 0;
  const isJobsSection = segments[0] === "tood";

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
      {isJobsSection ? jobsFooter : defaultFooter}
    </div>
  );
}
