import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { AuthShell } from "@/components/auth/AuthShell";

type Props = { params: Promise<{ locale: string }> };

export default async function SeekerOnboardingPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell title={t("onboardingSeekerTitle")} subtitle={t("onboardingSeekerSubtitle")}>
          <div className="text-sm text-white/70">
            {t("onboardingNotImplementedYet")}
          </div>
        </AuthShell>
      </main>
      <Footer />
    </div>
  );
}

