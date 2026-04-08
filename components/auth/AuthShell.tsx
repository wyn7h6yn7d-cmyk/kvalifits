"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-[calc(100dvh-var(--site-header-offset))] items-start justify-center pt-16 pb-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_0%,rgba(168,85,247,0.16),transparent_58%),radial-gradient(ellipse_70%_55%_at_100%_65%,rgba(227,31,141,0.06),transparent_55%)]"
      />
      <div className="relative w-full max-w-md px-6">
        <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-7 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur-md sm:p-8">
          <div className="text-balance text-2xl font-semibold tracking-tight text-white">
            {title}
          </div>
          {subtitle ? (
            <div className={cn("mt-2 text-sm leading-relaxed text-white/60")}>
              {subtitle}
            </div>
          ) : null}
          <div className="mt-7">{children}</div>
        </div>
      </div>
    </div>
  );
}

