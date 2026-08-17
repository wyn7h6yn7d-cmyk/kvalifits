import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/components/auth/AuthShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import { SeekerProfileForm } from "@/components/account/SeekerProfileForm";
import { loadSeekerProfileFormData } from "@/lib/account/loadSeekerProfileFormData";

type Props = { params: Promise<{ locale: string }> };

export default async function SeekerCertificatesPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login`);

  const { role, nextPath } = await getRoleAndNextPath(locale);
  if (role !== "seeker") redirect(`/${locale}/account`);
  if (nextPath.includes("/onboarding/")) redirect(nextPath);

  const initial = await loadSeekerProfileFormData(user);

  return (
    <AuthShell title={t("seekerCertificates")} subtitle={t("seekerCertificatesSubtitle")} maxWidthClassName="max-w-3xl">
          <SeekerProfileForm locale={locale} section="certificates" initial={initial} />
        </AuthShell>
  );
}
