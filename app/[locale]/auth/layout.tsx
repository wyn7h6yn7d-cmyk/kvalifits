import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ClientMessagesProvider } from "@/components/i18n/ClientMessagesProvider";
import { PublicSiteShell } from "@/components/site/PublicSiteShell";
import { AUTH_CLIENT_MESSAGE_NAMESPACES } from "@/lib/i18n/clientMessages";
import { NOINDEX_ROBOTS } from "@/lib/seo/site";

export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
};

export default async function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <ClientMessagesProvider namespaces={AUTH_CLIENT_MESSAGE_NAMESPACES}>
      <PublicSiteShell>{children}</PublicSiteShell>
    </ClientMessagesProvider>
  );
}
