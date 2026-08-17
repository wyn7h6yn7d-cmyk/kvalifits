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
        "rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-10 text-center sm:px-8",
        className,
      )}
    >
      {Icon ? (
        <div
          className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/40"
          aria-hidden
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
      ) : null}
      <p className="mx-auto max-w-md text-[15px] font-medium leading-snug tracking-tight text-white/88">
        {title}
      </p>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/50">{description}</p>
      ) : null}
      {actions ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
