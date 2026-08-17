import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

type Props = { params: Promise<{ locale: string }> };

export default async function ResetPasswordPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <AuthShell title={t("resetPasswordTitle")} subtitle={t("resetPasswordSubtitle")}>
      <ResetPasswordForm locale={locale} />
    </AuthShell>
  );
}

