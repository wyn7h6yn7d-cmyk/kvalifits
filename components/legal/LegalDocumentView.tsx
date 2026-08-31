"use client";

import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/routing";
import type { LegalSection } from "@/lib/content/legal";
import {
  SITE_BODY,
  SITE_BODY_LEAD,
  SITE_CONTAINER_PROSE,
  SITE_EYEBROW,
  SITE_H1_HERO,
  SITE_H2,
  SITE_SECTION_PY,
} from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

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
  prepend,
}: {
  doc: LegalProseDoc;
  showToc?: boolean;
  prepend?: ReactNode;
}) {
  const t = useTranslations("legalChrome");
  const locale = useLocale();
  const dateLocale = DATE_LOCALE[locale] ?? "et-EE";
  const toc = showToc ?? doc.sections.length >= 5;

  return (
    <div>
      <Container className={cn(SITE_CONTAINER_PROSE, SITE_SECTION_PY)}>
        {prepend ? <div className="mb-6">{prepend}</div> : null}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[0.9375rem] text-muted">
            {t("updated")}{" "}
            <time dateTime={doc.lastUpdated}>
              {new Date(doc.lastUpdated + "T12:00:00").toLocaleDateString(dateLocale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </p>
          <Link href="/" className="text-[0.9375rem] font-medium text-muted hover:text-foreground">
            {t("backHome")}
          </Link>
        </div>

        <h1 className={SITE_H1_HERO}>{doc.h1}</h1>
        {doc.lead ? (
          <p className={cn("mt-6 max-w-[34rem] text-pretty", SITE_BODY_LEAD)}>{doc.lead}</p>
        ) : null}

        {toc ? (
          <div className="mt-10">
            <div className={SITE_EYEBROW}>
              {t("contents")}
            </div>
            <ol className={cn("mt-4 list-decimal space-y-2.5 pl-5 marker:text-muted-2", SITE_BODY)}>
              {doc.sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="hover:text-foreground">
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        <div className="mt-14 space-y-14">
          {doc.sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-28">
              <h2 className={SITE_H2}>{s.title}</h2>
              <div className={cn("mt-5 space-y-4", SITE_BODY, "text-muted")}>
                {s.paragraphs.map((p, i) => (
                  <p key={i}>{renderParagraphWithLinks(p, locale)}</p>
                ))}
                {s.listItems?.length ? (
                  <ul className="list-disc space-y-2 pl-5 marker:text-muted-2">
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
          <p className="mt-14 text-xs leading-relaxed text-muted-2">
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
          className="text-foreground/80 underline decoration-border-strong underline-offset-2 hover:decoration-foreground/40"
        >
          {part}
        </Link>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
