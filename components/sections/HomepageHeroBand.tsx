import type { ReactNode } from "react";

import { HeroBackdrop } from "@/components/sections/HeroBackdrop";

export function HomepageHeroBand({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-[#07070c]">
      <HeroBackdrop />
      <div className="relative z-10">{children}</div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-20 bg-gradient-to-b from-transparent to-[var(--background)] sm:h-24 lg:h-28"
      />
    </div>
  );
}
