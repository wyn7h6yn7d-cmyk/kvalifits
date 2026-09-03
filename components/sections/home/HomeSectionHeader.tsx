import type { ReactNode } from "react";

import { SITE_BODY_LEAD, SITE_H2_HOME, SITE_HOME_SECTION_HEADER } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

export function HomeSectionHeader({
  title,
  id,
  lead,
  action,
  className,
}: {
  title: string;
  id?: string;
  lead?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        SITE_HOME_SECTION_HEADER,
        action && "flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-10",
        className,
      )}
    >
      <div className="min-w-0 max-w-2xl">
        <div className="mb-5 flex items-center gap-3" aria-hidden>
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-pink)]/80" />
          <span className="h-px w-10 bg-white/[0.14]" />
        </div>
        <h2 id={id} className={SITE_H2_HOME}>
          {title}
        </h2>
        {lead ? (
          <p className={cn("mt-4 max-w-xl text-pretty sm:mt-5", SITE_BODY_LEAD)}>{lead}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
