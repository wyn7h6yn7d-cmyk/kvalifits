import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { SITE_DARK_EMPTY_ICON, SITE_DARK_EMPTY_STATE } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(SITE_DARK_EMPTY_STATE, className)}>
      {Icon ? (
        <div className={SITE_DARK_EMPTY_ICON} aria-hidden>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
      ) : null}
      <p className="mx-auto max-w-md text-[1.0625rem] font-medium leading-snug tracking-normal text-foreground">
        {title}
      </p>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-base leading-[1.65] text-muted">{description}</p>
      ) : null}
      {actions ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
