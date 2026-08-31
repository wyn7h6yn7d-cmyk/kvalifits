import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

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
    <div
      className={cn(
        "rounded-xl border border-border bg-white px-5 py-10 text-center sm:px-8",
        className,
      )}
    >
      {Icon ? (
        <div
          className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-[#f8fafc] text-muted-2"
          aria-hidden
        >
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
