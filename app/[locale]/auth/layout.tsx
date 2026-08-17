import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PublicSiteShell } from "@/components/site/PublicSiteShell";
import { NOINDEX_ROBOTS } from "@/lib/seo/site";

export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <PublicSiteShell>{children}</PublicSiteShell>;
}
