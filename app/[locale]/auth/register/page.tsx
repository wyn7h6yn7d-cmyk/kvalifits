import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { AlreadySignedIn } from "@/components/auth/AlreadySignedIn";
import { getCurrentAuth } from "@/lib/auth/currentAuth";

type RegisterRole = "seeker" | "employer";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ role?: string | string[] }>;
};

function parseRegisterRole(raw: string | string[] | undefined): RegisterRole | undefined {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "employer" || v === "seeker") return v;
  return undefined;
}

export default async function RegisterPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const defaultRole = parseRegisterRole(sp.role);

  const t = await getTranslations({ locale, namespace: "auth" });
  const subtitle =
    defaultRole === "employer"
      ? t("registerSubtitleEmployer")
      : defaultRole === "seeker"
        ? t("registerSubtitleSeeker")
        : t("registerSubtitle");

  const auth = await getCurrentAuth();
  if (auth.isBlocked) redirect(`/${locale}/blocked`);

  return (
    <AuthShell title={t("registerTitle")} subtitle={subtitle}>
      {auth.authenticated ? <AlreadySignedIn /> : <RegisterForm locale={locale} defaultRole={defaultRole} />}
    </AuthShell>
  );
}

