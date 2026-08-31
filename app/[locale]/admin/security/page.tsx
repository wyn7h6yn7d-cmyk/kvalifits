import { getTranslations } from "next-intl/server";

import { AccountMfaSettings } from "@/components/account/AccountMfaSettings";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminIdentity } from "@/lib/admin/requireAdmin";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; setup?: string }>;
};

export default async function AdminSecurityPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  await requireAdminIdentity(locale);
  const t = await getTranslations({ locale, namespace: "admin" });

  const nextRaw = (sp.next ?? `/${locale}/admin`).toString();
  const nextPath = nextRaw.startsWith(`/${locale}/`) ? nextRaw : `/${locale}/admin`;
  const redirectAfterEnroll = sp.setup === "1" ? nextPath : undefined;

  return (
    <AdminShell title={t("securityTitle")} subtitle={t("securitySubtitle")} maxWidthClassName="max-w-md">
      <AccountMfaSettings nextPath={redirectAfterEnroll} />
    </AdminShell>
  );
}
