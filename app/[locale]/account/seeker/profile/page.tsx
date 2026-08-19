import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/components/auth/AuthShell";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import { SeekerProfileForm } from "@/components/account/SeekerProfileForm";
import { loadSeekerProfileFormData } from "@/lib/account/loadSeekerProfileFormData";

type Props = { params: Promise<{ locale: string }> };

export default async function SeekerProfilePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });

  const { user, role, nextPath } = await getRoleAndNextPath(locale);
  if (!user) redirect(nextPath);
  if (role !== "seeker") redirect(`/${locale}/account`);
  if (nextPath.includes("/onboarding/")) redirect(nextPath);

  const initial = await loadSeekerProfileFormData(user);

  return (
    <AuthShell title={t("seekerProfile")} subtitle={t("seekerProfileSubtitle")} maxWidthClassName="max-w-3xl">
          <SeekerProfileForm locale={locale} section="profile" initial={initial} />
        </AuthShell>
  );
}
