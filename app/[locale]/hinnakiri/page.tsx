import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/container";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return {
    title: t("pricing"),
  };
}

export default async function HinnakiriPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.employers" });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/auth/login`);

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const role = profile?.role ?? user.user_metadata?.role ?? null;
  if (role !== "employer") redirect(`/${locale}/account`);

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <PageHero eyebrow={t("heroEyebrow")} title={t("pricingTitle")} subtitle={t("ctaHint")}>
          <div className="max-w-xl rounded-3xl border border-white/[0.10] bg-white/[0.04] p-6 backdrop-blur-md">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
              {t("pricingTitle")}
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-baseline justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                <div className="text-sm font-medium text-white/85">{t("pricingDuration30")}</div>
                <div className="text-lg font-semibold tabular-nums text-white">99 €</div>
              </div>

              <div className="flex items-baseline justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                <div className="text-sm font-medium text-white/85">{t("pricingDuration90")}</div>
                <div className="text-lg font-semibold tabular-nums text-white">250 €</div>
              </div>
            </div>
          </div>
        </PageHero>

        <section className="border-t border-white/[0.06] py-14 sm:py-20">
          <Container>
            <div className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-white/55">
              {t("pricingTitle")}
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}

