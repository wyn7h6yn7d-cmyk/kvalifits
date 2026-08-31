import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { AlreadySignedIn } from "@/components/auth/AlreadySignedIn";
import { getCurrentAuth } from "@/lib/auth/currentAuth";
import { SITE_DARK_NOTICE } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ signup?: string; reset?: string; error?: string }>;
};

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "auth" });

  const auth = await getCurrentAuth();
  if (auth.isBlocked) redirect(`/${locale}/blocked`);

  const notice =
    sp.signup === "check-email"
      ? t("checkEmailNotice")
      : sp.reset === "success"
        ? t("resetSuccessNotice")
        : sp.error === "email_not_confirmed"
          ? t("errorEmailNotConfirmed")
          : sp.error === "account_blocked"
            ? t("errorAccountBlocked")
            : null;

  return (
    <AuthShell title={t("loginTitle")} subtitle={t("loginSubtitle")}>
      {notice ? (
        <div className={cn("mb-4", SITE_DARK_NOTICE)}>
          {notice}
        </div>
      ) : null}
      {auth.authenticated ? (
        <AlreadySignedIn />
      ) : (
        <LoginForm
          locale={locale}
          promptResend={sp.signup === "check-email" || sp.error === "email_not_confirmed"}
        />
      )}
    </AuthShell>
  );
}
