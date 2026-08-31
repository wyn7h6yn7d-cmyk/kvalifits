import { getTranslations } from "next-intl/server";

import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/routing";
import { SITE_BODY, SITE_H3 } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

export async function HomepageAudienceSection() {
  const t = await getTranslations("homeAudience");

  const paths = [
    {
      title: t("seekerTitle"),
      desc: t("seekerDesc"),
      cta: t("seekerLink"),
      ctaHref: "/tood",
      secondary: t("seekerSecondary"),
      secondaryHref: "/toootsijatele",
    },
    {
      title: t("employerTitle"),
      desc: t("employerDesc"),
      cta: t("employerLink"),
      ctaHref: "/auth/register?role=employer",
      secondary: t("employerSecondary"),
      secondaryHref: "/tooandjatele",
    },
  ] as const;

  return (
    <section className="border-t border-border" aria-labelledby="home-audience-title">
      <Container>
        <h2 id="home-audience-title" className="sr-only">
          {t("title")}
        </h2>
        <div className="grid sm:grid-cols-2">
          {paths.map((path, index) => (
            <div
              key={path.ctaHref}
              className={cn(
                "py-5 sm:py-6",
                index === 0
                  ? "border-b border-border sm:border-b-0 sm:border-r sm:border-border sm:pr-8"
                  : "sm:pl-8",
              )}
            >
              <h3 className={SITE_H3}>{path.title}</h3>
              <p className={cn("mt-1", SITE_BODY, "text-muted")}>{path.desc}</p>
              <p className="mt-3">
                <Link
                  href={path.ctaHref}
                  className="inline-flex min-h-11 items-center text-[0.9375rem] font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {path.cta}
                </Link>
              </p>
              <p>
                <Link
                  href={path.secondaryHref}
                  className="inline-flex min-h-11 items-center text-[0.9375rem] text-muted underline-offset-4 hover:text-foreground hover:underline"
                >
                  {path.secondary}
                </Link>
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
