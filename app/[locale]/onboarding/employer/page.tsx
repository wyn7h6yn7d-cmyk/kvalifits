import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { AuthShell } from "@/components/auth/AuthShell";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import { EmployerOnboardingForm } from "@/components/onboarding/EmployerOnboardingForm";

type Props = { params: Promise<{ locale: string }> };

export default async function EmployerOnboardingPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  const { role, nextPath } = await getRoleAndNextPath(locale);
  if (!role) redirect(`/${locale}/auth/login`);
  if (role !== "employer") redirect(nextPath);
  // If employer is already complete, bounce to their product area (prevents loops).
  if (nextPath !== `/${locale}/onboarding/employer`) redirect(nextPath);

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell
          title={t("onboardingEmployerTitle")}
          subtitle={t("onboardingEmployerSubtitle")}
          maxWidthClassName="max-w-3xl"
        >
          <EmployerOnboardingForm locale={locale} />
        </AuthShell>
      </main>
    </div>
  );
}

