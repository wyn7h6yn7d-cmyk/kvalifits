import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { AuthShell } from "@/components/auth/AuthShell";
import { AdminMfaSetupPanel } from "@/components/admin/AdminMfaSetupPanel";
import { requireAdminIdentity } from "@/lib/admin/requireAdmin";
import { getAdminMfaStatus } from "@/lib/auth/adminMfa";
import { Link } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; setup?: string }>;
};

export default async function AdminSecurityPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const { supabase } = await requireAdminIdentity(locale);
  const t = await getTranslations({ locale, namespace: "auth" });
  const mfa = await getAdminMfaStatus(supabase);

  const nextRaw = (sp.next ?? `/${locale}/admin`).toString();
  const nextPath = nextRaw.startsWith(`/${locale}/`) ? nextRaw : `/${locale}/admin`;

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell title={t("adminMfaTitle")} subtitle={t("adminMfaSubtitle")}>
          <div className="mb-4 text-xs text-white/50">
            {mfa.hasVerifiedTotp ? t("adminMfaStatusOn") : t("adminMfaStatusOff")}
            {mfa.currentLevel ? ` · AAL: ${mfa.currentLevel}` : null}
          </div>
          <AdminMfaSetupPanel locale={locale} nextPath={nextPath} />
          <div className="mt-6 text-center text-xs text-white/50">
            <Link href="/admin" className="hover:text-white/75">
              {t("adminMfaBack")}
            </Link>
          </div>
        </AuthShell>
      </main>
      <Footer />
    </div>
  );
}
