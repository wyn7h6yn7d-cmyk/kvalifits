"use client";

import { Building2, Clock, Mail, Phone, Share2, type LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { AmbientBackground } from "@/components/site/AmbientBackground";
import { Container } from "@/components/ui/container";
import type { ContactBlock, ContactPageContent } from "@/lib/content/legal";
import { PL } from "@/lib/content/legal";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

import { ContactForm } from "./ContactForm";

const DATE_LOCALE: Record<string, string> = {
  et: "et-EE",
  en: "en-GB",
  ru: "ru-RU",
};

const BLOCK_ICONS: Record<NonNullable<ContactBlock["icon"]>, LucideIcon> = {
  building2: Building2,
  mail: Mail,
  clock: Clock,
  phone: Phone,
  share2: Share2,
};

export function ContactPageView({ content }: { content: ContactPageContent }) {
  const locale = useLocale();
  const t = useTranslations("legalChrome");
  const dateLocale = DATE_LOCALE[locale] ?? "et-EE";

  return (
    <div className="relative overflow-hidden border-b border-white/[0.06]">
      <AmbientBackground intensity="soft" />
      <Container className="relative max-w-6xl py-14 sm:py-20">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
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

        <div className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.10] bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-transparent p-6 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.65)] sm:p-10">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl"
            aria-hidden
          />

          <h1 className="relative text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
            {content.h1}
          </h1>
          <p className="relative mt-4 max-w-2xl text-base leading-relaxed text-white/60 sm:text-[17px]">
            {content.lead}
          </p>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-start lg:gap-14">
          <div className="min-w-0">
            {content.blocksAside ? (
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-white/90">{content.blocksAside.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{content.blocksAside.lead}</p>
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              {content.blocks.map((b) => {
                const span = b.span ?? 1;
                const Icon = b.icon ? BLOCK_ICONS[b.icon] : null;
                return (
                  <div
                    key={b.title}
                    className={cn(
                      "flex flex-col rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6",
                      "shadow-[0_1px_0_rgba(255,255,255,0.05)_inset]",
                      span === 2 && "sm:col-span-2"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {Icon ? (
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-200/95 ring-1 ring-white/[0.08]"
                          aria-hidden
                        >
                          <Icon className="h-5 w-5" strokeWidth={1.75} />
                        </div>
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-semibold tracking-wide text-white/90">{b.title}</h2>
                        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/60">
                          {b.lines.map((line, i) => (
                            <li key={i} className="break-words">
                              {line}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="min-w-0 lg:sticky lg:top-[calc(var(--site-header-offset)+1.25rem)] lg:self-start">
            {content.formAside ? (
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-white/90">{content.formAside.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{content.formAside.lead}</p>
              </div>
            ) : null}
            <ContactForm form={content.form} mailTo={content.formMailTo ?? PL.emailGeneral} />
          </aside>
        </div>

        {content.footnote ? (
          <p className="mt-14 max-w-3xl border-t border-white/[0.08] pt-8 text-xs leading-relaxed text-white/40">
            {content.footnote}
          </p>
        ) : null}
      </Container>
    </div>
  );
}
