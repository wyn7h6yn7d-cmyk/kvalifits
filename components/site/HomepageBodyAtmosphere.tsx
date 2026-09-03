import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Very soft page wash — keeps sections connected without SaaS glow piles. */
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
        <div className="absolute -left-28 top-[12%] h-[22rem] w-[22rem] rounded-full bg-indigo-600/[0.028] blur-3xl" />
        <div className="absolute -right-24 top-[48%] h-[18rem] w-[18rem] rounded-full bg-violet-600/[0.024] blur-3xl" />
      </div>
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
