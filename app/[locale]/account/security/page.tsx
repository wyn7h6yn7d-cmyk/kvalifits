import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AccountMfaSettings } from "@/components/account/AccountMfaSettings";
import { AuthShell } from "@/components/auth/AuthShell";
import { Link } from "@/i18n/routing";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";

type Props = { params: Promise<{ locale: string }> };

export default async function AccountSecurityPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "accountSecurity" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const { user, role, nextPath } = await getRoleAndNextPath(locale);
  if (!user) redirect(nextPath);
  if (role === "admin") redirect(`/${locale}/admin/security`);
  if (nextPath.includes("/onboarding/")) redirect(nextPath);

  const backHref = role === "employer" ? "/account/employer" : "/account/seeker/profile";

  return (
    <AuthShell title={t("pageTitle")} subtitle={t("pageSubtitle")} maxWidthClassName="max-w-lg">
      <AccountMfaSettings />
      <p className="mt-6 text-center text-xs text-muted-2">
        <Link href={backHref} className="underline-offset-2 hover:underline">
          {tNav(role === "employer" ? "employerArea" : "seekerProfile")}
        </Link>
      </p>
    </AuthShell>
  );
}
