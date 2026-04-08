import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { AuthShell } from "@/components/auth/AuthShell";
import { Link } from "@/i18n/routing";
import { requireAdmin } from "@/lib/admin/requireAdmin";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminIndex({ params }: Props) {
  const { locale } = await params;
  await requireAdmin(locale);
  const t = await getTranslations({ locale, namespace: "admin" });

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell title={t("title")} subtitle={t("subtitle")} maxWidthClassName="max-w-3xl">
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/admin/jobs"
              className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 text-sm text-white/80 hover:bg-white/[0.04]"
            >
              <div className="font-medium text-white/85">{t("jobsTitle")}</div>
              <div className="mt-1 text-sm text-white/60">{t("jobsSubtitle")}</div>
            </Link>
            <Link
              href="/admin/users"
              className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 text-sm text-white/80 hover:bg-white/[0.04]"
            >
              <div className="font-medium text-white/85">{t("usersTitle")}</div>
              <div className="mt-1 text-sm text-white/60">{t("usersSubtitle")}</div>
            </Link>
          </div>
        </AuthShell>
      </main>
      <Footer />
    </div>
  );
}

