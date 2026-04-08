"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Fingerprint, Landmark, ShieldCheck } from "lucide-react";

import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

const cardBase =
  "h-full rounded-3xl border border-white/[0.08] bg-white/[0.02] px-6 py-8 sm:px-8";

const ICONS = [Fingerprint, ShieldCheck, Landmark] as const;

export function WhyKvalifits() {
  const t = useTranslations("why");

  const blocks = [
    { icon: ICONS[0], title: t("b1Title"), desc: t("b1Desc"), accentLeft: true },
    { icon: ICONS[1], title: t("b2Title"), desc: t("b2Desc"), accentLeft: false },
    { icon: ICONS[2], title: t("b3Title"), desc: t("b3Desc"), accentLeft: false },
  ] as const;

  return (
    <section id="miks" className="relative scroll-mt-24 py-20 sm:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/[0.03] to-transparent"
      />
      <Container>
        <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:max-w-xl lg:text-left">
          <div className="text-xs font-medium uppercase tracking-[0.26em] text-white/45">
            {t("eyebrow")}
          </div>
          <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.65rem]">
            {t("title")}
            <span className="block text-white/55"> {t("titleMuted")}</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/55 sm:text-lg">{t("subtitle")}</p>
        </div>

        <div className="mt-16 grid gap-6 sm:gap-8 lg:mt-20 lg:grid-cols-3 lg:gap-6">
          {blocks.map((b, idx) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-70px" }}
              transition={{ duration: 0.55, delay: idx * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                cardBase,
                b.accentLeft && "border-l-[3px] border-l-accent-pink/60 pl-5 sm:pl-7",
              )}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.04]">
                <b.icon className="h-5 w-5 text-white/75" />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-white">{b.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/60 sm:text-[15px]">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
