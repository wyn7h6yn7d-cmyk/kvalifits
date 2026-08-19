import type { ReactNode } from "react";
import type { Metadata } from "next";

import { AccountSiteShell } from "@/components/account/AccountSiteShell";
import { requireActiveAccountPage } from "@/lib/auth/requireActiveAccountPage";
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
  return <AccountSiteShell>{children}</AccountSiteShell>;
}
