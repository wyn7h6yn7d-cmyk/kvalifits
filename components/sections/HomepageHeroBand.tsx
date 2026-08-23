import type { ReactNode } from "react";

import { HeroBackdrop } from "@/components/sections/HeroBackdrop";

export function HomepageHeroBand({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-surface-deep">
      <HeroBackdrop />
      <div className="relative z-10">{children}</div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-32 bg-gradient-to-b from-transparent via-[#0f0f16]/50 to-[var(--surface)] sm:h-40 lg:h-48"
      />
    </div>
  );
}
