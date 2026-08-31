import type { ReactNode } from "react";

import { SITE_H2_HOME, SITE_HOME_SECTION_HEADER } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

export function HomeSectionHeader({
  title,
  id,
  action,
  className,
}: {
  title: string;
  id?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        SITE_HOME_SECTION_HEADER,
        action && "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8",
        className,
      )}
    >
      <div className="min-w-0">
        <div
          aria-hidden
          className="mb-4 h-px w-11 bg-gradient-to-r from-violet-400/70 via-[var(--accent-pink)]/50 to-transparent"
        />
        <h2 id={id} className={SITE_H2_HOME}>
          {title}
        </h2>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
