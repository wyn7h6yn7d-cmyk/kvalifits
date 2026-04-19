"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import { RegistrationConsentText } from "@/components/legal/RegistrationConsentText";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function FinalCTA() {
  const t = useTranslations("finalCta");

  return (
    <section id="registreeru" className="relative scroll-mt-[var(--site-header-offset)] py-24 sm:py-32">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative overflow-hidden rounded-[40px] border border-white/[0.1] px-8 py-12 sm:px-14 sm:py-16">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_20%_0%,rgba(168,85,247,0.35),transparent_55%),radial-gradient(ellipse_60%_70%_at_100%_100%,rgba(227,31,141,0.2),transparent_55%)]"
            />
            <div className="relative grid items-center gap-10 lg:grid-cols-[1.35fr_0.65fr] lg:gap-14">
              <div>
                <h3 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
                  {t("titleBefore")}{" "}
                  <span className="text-gradient-brand">{t("titleAccent")}</span>.
                </h3>
                <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-white/62 sm:text-lg sm:leading-relaxed">
                  {t("subtitle")}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button asChild variant="primary" size="lg" className="h-12 justify-center">
                  <Link href="#toootsijatele">{t("ctaSeeker")}</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 justify-center">
                  <Link href="/tooandjatele">{t("ctaEmployer")}</Link>
                </Button>
              </div>
            </div>
            <RegistrationConsentText className="relative mt-10 max-w-xl" />
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
