import type { ReactNode } from "react";

import { SITE_AUTH_CARD, SITE_BODY, SITE_CONTAINER, SITE_H1_UTILITY, SITE_PAGE_TOP } from "@/lib/site/publicPageLayout";
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
        "flex min-h-[calc(100dvh-var(--site-header-offset)-var(--site-bottom-nav-offset,0px))] items-start justify-center pb-16 lg:pb-20",
      )}
    >
      <div className={cn("w-full", SITE_CONTAINER, maxWidthClassName ?? "max-w-md")}>
        <div className={SITE_AUTH_CARD}>
          <h1 className={SITE_H1_UTILITY}>
            {title}
          </h1>
          {subtitle ? (
            <div className={cn("mt-3", SITE_BODY, "text-muted")}>
              {subtitle}
            </div>
          ) : null}
          <div className="mt-7">{children}</div>
        </div>
      </div>
    </div>
  );
}
