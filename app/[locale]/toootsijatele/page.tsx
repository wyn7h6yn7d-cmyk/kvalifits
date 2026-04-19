import { BadgeCheck, Target, UserPlus, UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.seekers" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ToootsijatelePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.seekers" });

  const details = [
    { icon: UserRound, title: t("d1Title"), text: t("d1Text") },
    { icon: BadgeCheck, title: t("d2Title"), text: t("d2Text") },
    { icon: Target, title: t("d3Title"), text: t("d3Text") },
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

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <PageHero eyebrow={t("heroEyebrow")} title={t("heroTitle")} subtitle={t("heroSubtitle")}>
          <>
            <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-6 sm:p-8 lg:p-10">
              <div className="text-[13px] font-medium uppercase tracking-wide text-white/52">
                {t("tutorialEyebrow")}
              </div>
              <h2 className="mt-3 text-balance text-xl font-semibold tracking-tight text-white sm:text-2xl">
                {t("tutorialTitle")}
              </h2>
              <ol className="mt-8 grid list-none gap-4 sm:gap-5">
                {tutorialSteps.map((step, index) => (
                  <li
                    key={step.title}
                    className="flex gap-4 rounded-2xl border border-white/[0.08] bg-black/25 p-5 sm:p-6"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.05] text-[13px] font-medium tabular-nums text-white/72">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[15px] font-medium text-white/90">{step.title}</div>
                      <p className="mt-2 text-[15px] leading-relaxed text-white/62 sm:text-base">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-8 border-t border-white/[0.08] pt-8">
                <Button
                  asChild
                  variant="primary"
                  size="lg"
                  className="h-12 rounded-2xl px-7"
                >
                  <Link href="/auth/register?role=seeker">
                    <UserPlus className="h-4 w-4" />
                    {t("tutorialCtaRegister")}
                  </Link>
                </Button>
              </div>
            </div>
          </>
        </PageHero>

        <section className="border-t border-white/[0.06] py-14 sm:py-20">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:items-start lg:gap-16">
              <div>
                <h2 className="text-[13px] font-medium uppercase tracking-wide text-white/52">
                  {t("sectionEyebrow")}
                </h2>
                <p className="mt-4 text-lg font-medium leading-snug text-white sm:text-xl">
                  {t("sectionLead")}
                </p>
                <p className="mt-4 text-[15px] leading-relaxed text-white/62 sm:text-base">{t("sectionBody")}</p>
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
                      <div className="text-[15px] font-medium text-white/90">{d.title}</div>
                      <p className="mt-2 text-[15px] leading-relaxed text-white/62 sm:text-base">{d.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>

        <section className="py-16 sm:py-20">
          <Container>
            <h2 className="text-center text-[13px] font-medium uppercase tracking-wide text-white/52">
              {t("pillarsTitle")}
            </h2>
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {highlights.map((x) => (
                <div
                  key={x.title}
                  className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-7"
                >
                  <div className="text-[15px] font-medium text-white/88">{x.title}</div>
                  <div className="mt-3 text-[15px] leading-7 text-white/68 sm:text-base">{x.desc}</div>
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
