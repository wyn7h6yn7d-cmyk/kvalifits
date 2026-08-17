import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { MfaChallengeForm } from "@/components/auth/MfaChallengeForm";
import { getAuthUser } from "@/lib/auth/currentAuth";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
};

export default async function MfaChallengePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "auth" });
  const user = await getAuthUser();
  if (!user) redirect(`/${locale}/auth/login`);

  const nextRaw = (sp.next ?? `/${locale}/admin`).toString();
  const nextPath = nextRaw.startsWith(`/${locale}/`) ? nextRaw : `/${locale}/admin`;

  return (
    <AuthShell title={t("mfaTitle")} subtitle={t("mfaSubtitle")}>
      <MfaChallengeForm locale={locale} nextPath={nextPath} />
    </AuthShell>
  );
}
