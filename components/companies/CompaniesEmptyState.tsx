import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function CompaniesEmptyState({
  icon: Icon,
  title,
  className,
}: {
  icon: LucideIcon;
  title: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.08] bg-[#12121a]/90 px-5 py-8 text-center sm:px-6 sm:py-9",
        className,
      )}
    >
      <div
        className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.10] bg-white/[0.04] text-muted"
        aria-hidden
      >
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <p className="mx-auto max-w-md text-base font-medium leading-snug text-foreground sm:text-[1.0625rem]">
        {title}
      </p>
    </div>
  );
}
