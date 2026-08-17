import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import { getAuthUser } from "@/lib/auth/currentAuth";

type Props = { params: Promise<{ locale: string }> };

export default async function ForgotPasswordPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  const user = await getAuthUser();
  if (user) {
    const { nextPath } = await getRoleAndNextPath(locale);
    redirect(nextPath);
  }

  return (
    <AuthShell title={t("forgotPasswordTitle")} subtitle={t("forgotPasswordSubtitle")}>
      <ForgotPasswordForm locale={locale} />
    </AuthShell>
  );
}

