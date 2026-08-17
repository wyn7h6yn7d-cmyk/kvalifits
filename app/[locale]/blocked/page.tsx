import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { AuthShell } from "@/components/auth/AuthShell";
import { Link } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export default async function BlockedPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell title={t("accessBlockedTitle")} subtitle={t("accessBlockedSubtitle")}>
          <div className="space-y-4 text-sm text-white/70">
            <p>{t("accessBlockedBody")}</p>
            <Link href="/kontakt" className="text-white/90 underline decoration-white/25 underline-offset-2 hover:decoration-white/50">
              {t("accessBlockedContactCta")}
            </Link>
          </div>
        </AuthShell>
      </main>
      <Footer />
    </div>
  );
}
