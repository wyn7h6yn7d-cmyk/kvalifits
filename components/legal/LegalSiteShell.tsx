import type { ReactNode } from "react";

import { Footer } from "@/components/sections/Footer";
import { Navbar } from "@/components/sections/Navbar";

export function LegalSiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">{children}</main>
      <Footer />
    </div>
  );
}
