import type { ReactNode } from "react";
import type { Metadata } from "next";

import { AccountSiteShell } from "@/components/account/AccountSiteShell";
import { NOINDEX_ROBOTS } from "@/lib/seo/site";

export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <AccountSiteShell>{children}</AccountSiteShell>;
}
