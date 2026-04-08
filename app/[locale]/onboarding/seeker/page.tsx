import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { AuthShell } from "@/components/auth/AuthShell";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import { SeekerOnboardingForm } from "@/components/onboarding/SeekerOnboardingForm";

type Props = { params: Promise<{ locale: string }> };

export default async function SeekerOnboardingPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  const { role, nextPath } = await getRoleAndNextPath(locale);
  if (!role) redirect(`/${locale}/auth/login`);
  if (role !== "seeker") redirect(nextPath);
  if (nextPath !== `/${locale}/onboarding/seeker`) redirect(nextPath);

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell
          title={t("onboardingSeekerTitle")}
          subtitle={t("onboardingSeekerSubtitle")}
          maxWidthClassName="max-w-3xl"
        >
          <SeekerOnboardingForm locale={locale} />
        </AuthShell>
      </main>
    </div>
  );
}

