"use client";

import { useLocale, useTranslations } from "next-intl";

import { AmbientBackground } from "@/components/site/AmbientBackground";
import { Container } from "@/components/ui/container";
import type { ContactPageContent } from "@/lib/content/legal";
import { PL } from "@/lib/content/legal";
import { Link } from "@/i18n/routing";

import { ContactForm } from "./ContactForm";

const DATE_LOCALE: Record<string, string> = {
  et: "et-EE",
  en: "en-GB",
  ru: "ru-RU",
};

export function ContactPageView({ content }: { content: ContactPageContent }) {
  const locale = useLocale();
  const t = useTranslations("legalChrome");
  const dateLocale = DATE_LOCALE[locale] ?? "et-EE";

  return (
    <div className="relative overflow-hidden border-b border-white/[0.06]">
      <AmbientBackground intensity="soft" />
      <Container className="relative max-w-3xl py-16 sm:py-20">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            {t("updated")}{" "}
            <time dateTime={content.lastUpdated}>
              {new Date(content.lastUpdated + "T12:00:00").toLocaleDateString(dateLocale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </p>
          <Link href="/" className="text-xs font-medium text-white/45 hover:text-white/75">
            {t("backHome")}
          </Link>
        </div>

        <h1 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {content.h1}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-white/65">{content.lead}</p>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
          <div className="space-y-6">
            {content.blocks.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  {b.title}
                </div>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/65">
                  {b.lines.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <ContactForm form={content.form} mailTo={PL.emailGeneral} />
        </div>

        {content.footnote ? (
          <p className="mt-12 border-t border-white/[0.08] pt-8 text-xs leading-relaxed text-white/40">
            {content.footnote}
          </p>
        ) : null}
      </Container>
    </div>
  );
}
