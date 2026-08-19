import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/components/auth/AuthShell";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import { EmployerNewJobForm } from "@/components/jobs/EmployerNewJobForm";

type Props = { params: Promise<{ locale: string }> };

export default async function EmployerNewJobPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "jobs" });

  const { user, role, nextPath } = await getRoleAndNextPath(locale);
  if (!user) redirect(nextPath);
  if (role !== "employer") redirect(`/${locale}/account`);
  if (nextPath.includes("/onboarding/")) redirect(nextPath);

  return (
    <AuthShell title={t("createTitle")} subtitle={t("createSubtitle")} maxWidthClassName="max-w-3xl">
          <EmployerNewJobForm locale={locale} />
        </AuthShell>
  );
}

