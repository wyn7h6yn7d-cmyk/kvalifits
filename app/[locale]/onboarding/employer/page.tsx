import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { AuthShell } from "@/components/auth/AuthShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ locale: string }> };

export default async function EmployerOnboardingPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/auth/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "employer") redirect(`/${locale}/onboarding`);

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell title={t("onboardingEmployerTitle")} subtitle={t("onboardingEmployerSubtitle")}>
          <div className="text-sm text-white/70">
            {t("onboardingNotImplementedYet")}
          </div>
        </AuthShell>
      </main>
      <Footer />
    </div>
  );
}

