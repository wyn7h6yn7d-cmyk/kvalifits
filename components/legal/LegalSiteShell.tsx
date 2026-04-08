import type { ReactNode } from "react";

import { Footer } from "@/components/sections/Footer";
import { Navbar } from "@/components/sections/Navbar";
import { Container } from "@/components/ui/container";
import { LegalLocaleSwitch } from "./LegalLocaleSwitch";

export function LegalSiteShell({
  docPath,
  children,
}: {
  docPath: string;
  children: ReactNode;
}) {
  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <div className="border-b border-white/[0.06] bg-background/70">
          <Container className="flex justify-end py-3">
            <LegalLocaleSwitch docPath={docPath} />
          </Container>
        </div>
        {children}
      </main>
      <Footer />
    </div>
  );
}
