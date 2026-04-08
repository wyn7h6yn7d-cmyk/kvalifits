import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { AuthShell } from "@/components/auth/AuthShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";

type Props = { params: Promise<{ locale: string }> };

export default async function EmployerCandidatesPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/auth/login`);

  const { role, nextPath } = await getRoleAndNextPath(locale);
  if (role !== "employer") redirect(`/${locale}/account`);
  if (nextPath.includes("/onboarding/")) redirect(nextPath);

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell title={t("candidates")} subtitle={t("candidatesSubtitle")} maxWidthClassName="max-w-3xl">
          <div className="text-sm text-white/70">{t("areaNotImplementedYet")}</div>
        </AuthShell>
      </main>
      <Footer />
    </div>
  );
}

