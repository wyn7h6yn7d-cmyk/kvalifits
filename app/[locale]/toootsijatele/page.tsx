import { BadgeCheck, LogIn, Target, UserPlus, UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";

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
  const t = await getTranslations("pages.seekers");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if ((profile as any)?.role !== "admin") {
      const { nextPath } = await getRoleAndNextPath(locale);
      redirect(nextPath);
    }
  }

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

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <PageHero
          eyebrow={t("heroEyebrow")}
          title={t("heroTitle")}
          subtitle={t("heroSubtitle")}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button asChild variant="primary" size="lg" className="h-12 rounded-2xl px-7">
              <Link href="/auth/register">
                <UserPlus className="h-4 w-4" />
                {t("ctaSignup")}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-2xl px-7">
              <Link href="/auth/login">
                <LogIn className="h-4 w-4" />
                {t("ctaLogin")}
              </Link>
            </Button>
          </div>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/45">{t("ctaHint")}</p>
        </PageHero>

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
