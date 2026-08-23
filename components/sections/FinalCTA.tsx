import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { RegistrationConsentText } from "@/components/legal/RegistrationConsentText";
import { GradientAccentText } from "@/components/site/GradientAccentText";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export async function FinalCTA() {
  const t = await getTranslations("finalCta");

  return (
    <section
      id="registreeru"
      className="relative scroll-mt-[var(--site-header-offset)] overflow-hidden bg-surface py-10 sm:py-14 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_18%_15%,rgba(168,85,247,0.14),transparent_58%)]"
      />

      <Container className="relative z-10">
        <div className="kf-enter grid min-w-0 items-center gap-6 sm:gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:gap-16">
          <div className="min-w-0">
            <h3 className="text-balance text-[1.625rem] font-semibold leading-tight tracking-tight text-foreground sm:text-2xl lg:text-[2.75rem]">
              {t("titleBefore")}{" "}
              <GradientAccentText>{t("titleAccent")}</GradientAccentText>.
            </h3>
            <p className="mt-3 max-w-xl text-pretty text-base leading-relaxed text-body sm:mt-4 sm:text-lg sm:leading-relaxed lg:mt-5">
              {t("subtitle")}
            </p>
            <RegistrationConsentText className="mt-4 max-w-xl sm:mt-6 lg:mt-7" />
          </div>
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row lg:flex-col">
            <Button asChild variant="primary" size="lg" className="h-12 w-full min-w-0 justify-center text-pretty sm:flex-1 lg:w-full">
              <Link href="#toootsijatele">{t("ctaSeeker")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 w-full min-w-0 justify-center text-pretty sm:flex-1 lg:w-full">
              <Link href="/tooandjatele">{t("ctaEmployer")}</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
