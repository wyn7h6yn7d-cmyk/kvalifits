import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { AuthShell } from "@/components/auth/AuthShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import { SeekerProfileForm } from "@/components/account/SeekerProfileForm";

type Props = { params: Promise<{ locale: string }> };

export default async function SeekerAccountPage({ params }: Props) {
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

  const { data: seeker } = await supabase
    .from("seeker_profiles")
    .select(
      "full_name,phone,location,about,skills,experience_level,preferred_job_types,preferred_locations"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: certs } = await supabase
    .from("seeker_certificates")
    .select("id,certificate_name,certificate_number,certificate_issuer,certificate_valid_from,certificate_valid_until")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell title={t("seekerArea")} subtitle={t("seekerAreaSubtitle")} maxWidthClassName="max-w-3xl">
          <SeekerProfileForm
            locale={locale}
            initial={{
              email: user.email ?? "",
              avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
              linkedin_url: (user.user_metadata?.linkedin_url as string | undefined) ?? null,
              seeker: seeker ?? null,
              certificates: certs ?? [],
            }}
          />
        </AuthShell>
      </main>
      <Footer />
    </div>
  );
}

