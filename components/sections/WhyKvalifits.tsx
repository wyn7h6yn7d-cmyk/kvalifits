"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Fingerprint, Landmark, ShieldCheck } from "lucide-react";

import { Container } from "@/components/ui/container";

const ICONS = [Fingerprint, ShieldCheck, Landmark] as const;

export function WhyKvalifits() {
  const t = useTranslations("why");

  const blocks = [
    { icon: ICONS[0], title: t("b1Title"), desc: t("b1Desc") },
    { icon: ICONS[1], title: t("b2Title"), desc: t("b2Desc") },
    { icon: ICONS[2], title: t("b3Title"), desc: t("b3Desc") },
  ] as const;

  return (
    <section id="miks" className="relative scroll-mt-24 overflow-hidden bg-surface py-28 sm:py-36 lg:py-40">
      {/* Calm after hero — static wash only, no animated portal */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_10%_0%,rgba(255,255,255,0.03),transparent_55%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#15151F]/80 sm:h-32"
      />

      <Container className="relative z-10">
        <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:max-w-xl lg:text-left">
          <div className="text-[13px] font-medium uppercase tracking-wide text-muted-2 sm:text-sm">
            {t("eyebrow")}
          </div>
          <h2 className="mt-5 text-balance text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.65rem]">
            {t("title")}
            <span className="block text-muted-2"> {t("titleMuted")}</span>
          </h2>
          <p className="mt-6 text-base leading-relaxed text-body sm:text-lg sm:leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-20 max-w-4xl space-y-0 lg:mt-24">
          {blocks.map((b, idx) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="group grid gap-4 border-t border-white/[0.07] py-10 first:border-t-0 first:pt-0 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-8 sm:py-12"
            >
              <div className="flex h-10 w-10 items-center justify-center text-muted">
                <b.icon className="h-5 w-5" strokeWidth={1.6} />
              </div>
              <div className="min-w-0 max-w-xl">
                <h3 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  {b.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-body sm:text-base sm:leading-relaxed">
                  {b.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
