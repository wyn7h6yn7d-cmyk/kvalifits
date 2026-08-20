import { getTranslations } from "next-intl/server";

import { AdminMfaSetupPanel } from "@/components/admin/AdminMfaSetupPanel";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminIdentity } from "@/lib/admin/requireAdmin";
import { getAdminMfaStatus } from "@/lib/auth/adminMfa";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; setup?: string }>;
};

export default async function AdminSecurityPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const { supabase } = await requireAdminIdentity(locale);
  const t = await getTranslations({ locale, namespace: "admin" });
  const tAuth = await getTranslations({ locale, namespace: "auth" });
  const mfa = await getAdminMfaStatus(supabase);

  const nextRaw = (sp.next ?? `/${locale}/admin`).toString();
  const nextPath = nextRaw.startsWith(`/${locale}/`) ? nextRaw : `/${locale}/admin`;

  return (
    <AdminShell title={t("securityTitle")} subtitle={t("securitySubtitle")} maxWidthClassName="max-w-md">
      <p
        className={
          mfa.hasVerifiedTotp
            ? "text-sm text-emerald-100/90"
            : "mb-4 text-sm text-white/55"
        }
      >
        {mfa.hasVerifiedTotp ? tAuth("adminMfaAlreadyEnabled") : tAuth("adminMfaStatusOff")}
      </p>
      <AdminMfaSetupPanel locale={locale} nextPath={nextPath} />
    </AdminShell>
  );
}
