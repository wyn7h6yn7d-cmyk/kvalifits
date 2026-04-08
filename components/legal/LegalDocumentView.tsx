"use client";

import { useLocale, useTranslations } from "next-intl";

import { AmbientBackground } from "@/components/site/AmbientBackground";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/routing";
import type { LegalSection } from "@/lib/content/legal";

const INLINE_LEGAL_PATH =
  /(\/(?:et|en|ru)\/(?:privaatsus|tingimused|kupsised|andmekaitse|kontakt|ettevote)|\/(?:privaatsus|tingimused|kupsised|andmekaitse|kontakt|ettevote))/g;

function isLegalSegment(segment: string) {
  return (
    /^\/(?:et|en|ru)\/(?:privaatsus|tingimused|kupsised|andmekaitse|kontakt|ettevote)$/.test(
      segment
    ) ||
    /^\/(?:privaatsus|tingimused|kupsised|andmekaitse|kontakt|ettevote)$/.test(segment)
  );
}

function normalizeLegalHref(segment: string, locale: string): string {
  if (/^\/(?:et|en|ru)\//.test(segment)) return segment;
  if (
    /^\/(?:privaatsus|tingimused|kupsised|andmekaitse|kontakt|ettevote)$/.test(segment)
  ) {
    return `/${locale}${segment}`;
  }
  return segment;
}

export type LegalProseDoc = {
  h1: string;
  lead?: string;
  lastUpdated: string;
  sections: LegalSection[];
  footnote?: string;
};

const DATE_LOCALE: Record<string, string> = {
  et: "et-EE",
  en: "en-GB",
  ru: "ru-RU",
};

export function LegalDocumentView({
  doc,
  showToc,
}: {
  doc: LegalProseDoc;
  showToc?: boolean;
}) {
  const t = useTranslations("legalChrome");
  const locale = useLocale();
  const dateLocale = DATE_LOCALE[locale] ?? "et-EE";
  const toc = showToc ?? doc.sections.length >= 5;

  return (
    <div className="relative overflow-hidden border-b border-white/[0.06]">
      <AmbientBackground intensity="soft" />
      <Container className="relative max-w-3xl py-16 sm:py-20">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            {t("updated")}{" "}
            <time dateTime={doc.lastUpdated}>
              {new Date(doc.lastUpdated + "T12:00:00").toLocaleDateString(dateLocale, {
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
          {doc.h1}
        </h1>
        {doc.lead ? (
          <p className="mt-5 text-base leading-relaxed text-white/65">{doc.lead}</p>
        ) : null}

        {toc ? (
          <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              {t("contents")}
            </div>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-white/70 marker:text-white/35">
              {doc.sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="hover:text-white">
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        <div className="mt-12 space-y-12">
          {doc.sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-28">
              <h2 className="text-lg font-semibold text-white">{s.title}</h2>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-white/65">
                {s.paragraphs.map((p, i) => (
                  <p key={i}>{renderParagraphWithLinks(p, locale)}</p>
                ))}
                {s.listItems?.length ? (
                  <ul className="list-disc space-y-2 pl-5 marker:text-white/35">
                    {s.listItems.map((item, i) => (
                      <li key={i}>{renderParagraphWithLinks(item, locale)}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>
          ))}
        </div>

        {doc.footnote ? (
          <p className="mt-14 border-t border-white/[0.08] pt-8 text-xs leading-relaxed text-white/40">
            {doc.footnote}
          </p>
        ) : null}
      </Container>
    </div>
  );
}

function renderParagraphWithLinks(text: string, locale: string) {
  const parts = text.split(INLINE_LEGAL_PATH);
  return parts.map((part, i) => {
    if (isLegalSegment(part)) {
      const href = normalizeLegalHref(part, locale);
      return (
        <Link
          key={i}
          href={href}
          className="text-white/80 underline decoration-white/25 underline-offset-2 hover:decoration-white/50"
        >
          {part}
        </Link>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
