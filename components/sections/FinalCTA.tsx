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
      className="relative scroll-mt-[var(--site-header-offset)] overflow-hidden bg-surface py-12 sm:py-16 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_18%_15%,rgba(168,85,247,0.14),transparent_58%)]"
      />

      <Container className="relative z-10">
        <div className="kf-enter grid items-center gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:gap-16">
          <div>
            <h3 className="text-balance text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl lg:text-[2.75rem]">
              {t("titleBefore")}{" "}
              <GradientAccentText>{t("titleAccent")}</GradientAccentText>.
            </h3>
            <p className="mt-4 max-w-xl text-[1.0625rem] leading-relaxed text-body sm:mt-5 sm:text-lg sm:leading-relaxed">
              {t("subtitle")}
            </p>
            <RegistrationConsentText className="mt-5 max-w-xl sm:mt-7" />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Button asChild variant="primary" size="lg" className="h-12 w-full justify-center sm:flex-1 lg:w-full">
              <Link href="#toootsijatele">{t("ctaSeeker")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 w-full justify-center sm:flex-1 lg:w-full">
              <Link href="/tooandjatele">{t("ctaEmployer")}</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
