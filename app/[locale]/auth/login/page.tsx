import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { AlreadySignedIn } from "@/components/auth/AlreadySignedIn";
import { getCurrentAuth } from "@/lib/auth/currentAuth";

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
        <div className="mb-4 rounded-2xl border border-border bg-[#f8fafc] px-4 py-3 text-sm text-muted">
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
