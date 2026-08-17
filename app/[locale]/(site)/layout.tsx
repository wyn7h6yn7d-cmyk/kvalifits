import type { ReactNode } from "react";

import { PublicSiteShell } from "@/components/site/PublicSiteShell";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <PublicSiteShell>{children}</PublicSiteShell>;
}
