import type { ReactNode } from "react";

import { Footer } from "@/components/sections/Footer";
import { Navbar } from "@/components/sections/Navbar";

export function AccountSiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)] pb-[var(--site-bottom-nav-offset,0px)]">{children}</main>
      <Footer />
    </div>
  );
}
