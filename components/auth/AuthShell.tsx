import type { ReactNode } from "react";

import { SITE_AUTH_CARD, SITE_CONTAINER, SITE_PAGE_TOP } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

export function AuthShell({
  title,
  subtitle,
  children,
  maxWidthClassName,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidthClassName?: string;
}) {
  return (
    <div
      className={cn(
        SITE_PAGE_TOP,
        "relative flex min-h-[calc(100dvh-var(--site-header-offset)-var(--site-bottom-nav-offset,0px))] items-start justify-center pb-16 lg:pb-20",
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_0%,rgba(168,85,247,0.16),transparent_58%),radial-gradient(ellipse_70%_55%_at_100%_65%,rgba(227,31,141,0.06),transparent_55%)]"
      />
      <div className={cn("relative w-full", SITE_CONTAINER, maxWidthClassName ?? "max-w-md")}>
        <div className={cn(SITE_AUTH_CARD, "shadow-[0_24px_80px_-40px_rgba(0,0,0,0.9)]")}>
          <h1 className="text-balance text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {title}
          </h1>
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
