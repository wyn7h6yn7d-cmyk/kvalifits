import type { ReactNode } from "react";

import { Footer } from "@/components/sections/Footer";
import { Navbar } from "@/components/sections/Navbar";
import { PublicSiteMain } from "@/components/site/PublicSiteMain";

type Props = {
  children: ReactNode;
};

export function PublicSiteShell({ children }: Props) {
  return (
    <PublicSiteMain
      navbar={<Navbar />}
      jobsFooter={<Footer compact />}
      defaultFooter={<Footer />}
    >
      {children}
    </PublicSiteMain>
  );
}
