import type { ReactNode } from "react";

import { ClientMessagesProvider } from "@/components/i18n/ClientMessagesProvider";
import { PublicSiteShell } from "@/components/site/PublicSiteShell";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <ClientMessagesProvider mode="site">
      <PublicSiteShell>{children}</PublicSiteShell>
    </ClientMessagesProvider>
  );
}
