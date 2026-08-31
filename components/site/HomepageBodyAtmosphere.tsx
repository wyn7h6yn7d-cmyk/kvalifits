import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Soft page-wide violet/indigo wash — keeps sections feeling connected, not flat blocks. */
export function HomepageBodyAtmosphere({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative bg-background", className)}>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-[8%] h-[28rem] w-[28rem] rounded-full bg-indigo-600/[0.045] blur-3xl lg:-left-32 lg:h-[32rem] lg:w-[32rem]" />
        <div className="absolute -right-20 top-[32%] h-[24rem] w-[24rem] rounded-full bg-violet-600/[0.04] blur-3xl lg:-right-28" />
        <div className="absolute left-1/2 top-[58%] h-[18rem] w-[18rem] -translate-x-1/2 rounded-full bg-[var(--accent-pink)]/[0.03] blur-3xl" />
      </div>
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
