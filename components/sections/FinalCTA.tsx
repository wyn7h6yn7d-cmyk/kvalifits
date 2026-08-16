"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import { RegistrationConsentText } from "@/components/legal/RegistrationConsentText";
import { AmbientBackground } from "@/components/site/AmbientBackground";
import { GradientAccentText } from "@/components/site/GradientAccentText";
import { PortalBackground } from "@/components/site/portal-background";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ctaSectionPortal } from "@/lib/site-portal-config";

export function FinalCTA() {
  const t = useTranslations("finalCta");

  return (
    <section
      id="registreeru"
      className="relative scroll-mt-[var(--site-header-offset)] overflow-hidden bg-surface-deep py-28 sm:py-36 lg:py-40"
    >
      <AmbientBackground intensity={ctaSectionPortal.ambientIntensity} />
      {ctaSectionPortal.enabled ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ opacity: ctaSectionPortal.opacity }}
          aria-hidden="true"
        >
          <PortalBackground
            variant={ctaSectionPortal.variant}
            intensity={ctaSectionPortal.intensity}
          />
        </div>
      ) : null}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_18%_15%,rgba(168,85,247,0.18),transparent_58%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#09090D]/45"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-[#09090D]"
      />

      <Container className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="grid items-center gap-12 lg:grid-cols-[1.4fr_0.6fr] lg:gap-16"
        >
          <div>
            <h3 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
              {t("titleBefore")}{" "}
              <GradientAccentText>{t("titleAccent")}</GradientAccentText>.
            </h3>
            <p className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-body sm:text-lg sm:leading-relaxed">
              {t("subtitle")}
            </p>
            <RegistrationConsentText className="mt-10 max-w-xl" />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Button asChild variant="primary" size="lg" className="h-12 justify-center">
              <Link href="#toootsijatele">{t("ctaSeeker")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 justify-center">
              <Link href="/tooandjatele">{t("ctaEmployer")}</Link>
            </Button>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
