import type { ReactNode } from "react";
import type { Metadata } from "next";

import { AccountSiteShell } from "@/components/account/AccountSiteShell";
import { ClientMessagesProvider } from "@/components/i18n/ClientMessagesProvider";
import { requireActiveAccountPage } from "@/lib/auth/requireActiveAccountPage";
import { ACCOUNT_CLIENT_MESSAGE_NAMESPACES } from "@/lib/i18n/clientMessages";
import { NOINDEX_ROBOTS } from "@/lib/seo/site";

export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
};

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AccountLayout({ children, params }: Props) {
  const { locale } = await params;
  await requireActiveAccountPage(locale);
  return (
    <ClientMessagesProvider namespaces={ACCOUNT_CLIENT_MESSAGE_NAMESPACES}>
      <AccountSiteShell>{children}</AccountSiteShell>
    </ClientMessagesProvider>
  );
}
