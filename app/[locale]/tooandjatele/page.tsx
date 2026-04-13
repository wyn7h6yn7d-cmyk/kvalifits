import { ArrowRight, Building2, ClipboardCheck, UserPlus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmployerProductPreview } from "@/components/employer/EmployerProductPreview";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.employers" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function TooandjatelePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.employers" });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  const role = profile?.role ?? user?.user_metadata?.role ?? null;
  const showPricing = role === "employer";

  const details = [
    { icon: Building2, title: t("d1Title"), text: t("d1Text") },
    { icon: ClipboardCheck, title: t("d2Title"), text: t("d2Text") },
    { icon: ArrowRight, title: t("d3Title"), text: t("d3Text") },
  ];

  const highlights = [
    { title: t("p1Title"), desc: t("p1Desc") },
    { title: t("p2Title"), desc: t("p2Desc") },
    { title: t("p3Title"), desc: t("p3Desc") },
  ];

  const tutorialSteps = [
    { title: t("tutorialStep1Title"), body: t("tutorialStep1Body") },
    { title: t("tutorialStep2Title"), body: t("tutorialStep2Body") },
    { title: t("tutorialStep3Title"), body: t("tutorialStep3Body") },
    { title: t("tutorialStep4Title"), body: t("tutorialStep4Body") },
    { title: t("tutorialStep5Title"), body: t("tutorialStep5Body") },
  ] as const;

  const tutorialBenefits = [
    t("tutorialBenefit1"),
    t("tutorialBenefit2"),
    t("tutorialBenefit3"),
    t("tutorialBenefit4"),
  ] as const;

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <PageHero
          eyebrow={t("heroEyebrow")}
          title={t("heroTitle")}
          subtitle={
            <>
              {t("heroSubtitleLead")}
              {t("heroSubtitleTail")}{" "}
              <span className="ml-1 inline-flex translate-y-[-0.05em] items-center rounded-full border border-white/[0.14] bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
                {t("heroDemoLabel")}
              </span>
            </>
          }
        >
          <>
            <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-6 sm:p-8 lg:p-10">
              <h2 className="text-balance text-xl font-semibold tracking-tight text-white sm:text-2xl">
                {t("tutorialSectionTitle")}
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/58">{t("tutorialSectionIntro")}</p>
              <ol className="mt-8 grid list-none gap-4 sm:gap-5">
                {tutorialSteps.map((step) => (
                  <li
                    key={step.title}
                    className="rounded-2xl border border-white/[0.08] bg-black/25 p-5 sm:p-6"
                  >
                    <div className="text-sm font-medium text-white/90">{step.title}</div>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/58">{step.body}</p>
                  </li>
                ))}
              </ol>

              <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
                  {t("tutorialBenefitsTitle")}
                </div>
                <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-white/65">
                  {tutorialBenefits.map((line) => (
                    <li key={line} className="flex gap-2.5">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/35" aria-hidden />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 border-t border-white/[0.08] pt-8">
                <div className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                  {t("tutorialCtaSectionTitle")}
                </div>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/55">{t("tutorialCtaSectionText")}</p>
                <div className="mt-5">
                  <Button
                    asChild
                    variant="primary"
                    size="lg"
                    className="h-12 rounded-2xl px-7"
                  >
                    <Link href="/auth/register?role=employer">
                      <UserPlus className="h-4 w-4" />
                      {t("tutorialCtaRegister")}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {showPricing ? (
              <div className="mx-auto max-w-3xl pt-6">
                <div className="max-w-xl rounded-3xl border border-white/[0.10] bg-white/[0.04] p-6 backdrop-blur-md">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
                    {t("pricingTitle")}
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-baseline justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                      <div className="text-sm font-medium text-white/85">
                        {t("pricingDuration30")}
                      </div>
                      <div className="font-mono text-lg font-semibold text-white">99 €</div>
                    </div>

                    <div className="flex items-baseline justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                      <div className="text-sm font-medium text-white/85">
                        {t("pricingDuration90")}
                      </div>
                      <div className="font-mono text-lg font-semibold text-white">250 €</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        </PageHero>

        <EmployerProductPreview />

        <section className="border-t border-white/[0.06] py-14 sm:py-20">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:items-start lg:gap-16">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-white/45">
                  {t("sectionEyebrow")}
                </h2>
                <p className="mt-4 text-lg font-medium leading-snug text-white sm:text-xl">
                  {t("sectionLead")}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-white/58">{t("sectionBody")}</p>
                <p className="mt-4 text-sm leading-relaxed text-white/58">{t("sectionPractice")}</p>
              </div>
              <ul className="space-y-5">
                {details.map((d) => (
                  <li
                    key={d.title}
                    className="flex gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.1] bg-black/30">
                      <d.icon className="h-4 w-4 text-white/70" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white/90">{d.title}</div>
                      <p className="mt-1.5 text-sm leading-relaxed text-white/58">{d.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>

        <section className="py-16 sm:py-20">
          <Container>
            <h2 className="text-center text-sm font-semibold uppercase tracking-[0.22em] text-white/45">
              {t("pillarsTitle")}
            </h2>
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {highlights.map((x) => (
                <div
                  key={x.title}
                  className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-7"
                >
                  <div className="text-sm font-medium text-white/85">{x.title}</div>
                  <div className="mt-3 text-sm leading-6 text-white/65">{x.desc}</div>
                </div>
              ))}
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}
