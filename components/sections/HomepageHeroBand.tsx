import type { ReactNode } from "react";

import { HeroBackdrop } from "@/components/sections/HeroBackdrop";

export function HomepageHeroBand({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-white">
      <HeroBackdrop />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
