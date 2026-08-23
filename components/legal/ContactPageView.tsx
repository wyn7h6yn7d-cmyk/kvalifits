"use client";

import { Building2, Clock, Mail, Phone, Share2, type LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { AmbientBackground } from "@/components/site/AmbientBackground";
import { Container } from "@/components/ui/container";
import type { ContactBlock, ContactPageContent } from "@/lib/content/legal";
import { contactFormMailto } from "@/lib/content/legal";
import { Link } from "@/i18n/routing";
import {
  SITE_GRID_GAP_LOOSE,
  SITE_H1_HERO,
  SITE_H2,
  SITE_SECTION_PY,
} from "@/lib/site/publicPageLayout";
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

/** Groups consecutive single-column blocks so they can share one row without separate card chrome. */
function contactInfoRows(blocks: ContactBlock[]): Array<ContactBlock | ContactBlock[]> {
  const rows: Array<ContactBlock | ContactBlock[]> = [];
  let buf: ContactBlock[] = [];
  const flush = () => {
    if (buf.length === 0) return;
    rows.push(buf.length === 1 ? buf[0]! : [...buf]);
    buf = [];
  };
  for (const b of blocks) {
    if (b.span === 2) {
      flush();
      rows.push(b);
    } else {
      buf.push(b);
    }
  }
  flush();
  return rows;
}

function ContactInfoSection({ block }: { block: ContactBlock }) {
  const Icon = block.icon ? BLOCK_ICONS[block.icon] : null;
  return (
    <div className="flex min-w-0 items-start gap-3 sm:gap-4">
      {Icon ? (
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/12 text-violet-200/90 ring-1 ring-white/[0.06]"
          aria-hidden
        >
          <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold tracking-wide text-white/90">{block.title}</h3>
        <ul className="mt-2.5 space-y-1.5 text-sm leading-relaxed text-white/60">
          {block.lines.map((line, i) => (
            <li key={i} className="break-words">
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ContactPageView({ content }: { content: ContactPageContent }) {
  const locale = useLocale();
  const t = useTranslations("legalChrome");
  const dateLocale = DATE_LOCALE[locale] ?? "et-EE";

  return (
    <div className="relative overflow-hidden">
      <AmbientBackground intensity="soft" />
      <Container className={cn("relative", SITE_SECTION_PY)}>
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

        <h1 className={SITE_H1_HERO}>{content.h1}</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/60 sm:text-[17px]">
          {content.lead}
        </p>

        <div
          className={cn(
            "mt-10 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-stretch",
            SITE_GRID_GAP_LOOSE,
          )}
        >
          <div className="flex min-h-0 h-full min-w-0 flex-col">
            {content.blocksAside ? (
              <header className="mb-8">
                <h2 className={SITE_H2}>{content.blocksAside.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{content.blocksAside.lead}</p>
              </header>
            ) : null}
            <div className="space-y-8">
              {contactInfoRows(content.blocks).map((row) => (
                <div
                  key={Array.isArray(row) ? `pair-${row.map((b) => b.title).join("-")}` : row.title}
                  className={cn(Array.isArray(row) && "grid gap-8 sm:grid-cols-2 sm:gap-10")}
                >
                  {Array.isArray(row) ? (
                    row.map((b) => <ContactInfoSection key={b.title} block={b} />)
                  ) : (
                    <ContactInfoSection block={row} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <aside className="flex min-h-0 h-full min-w-0 flex-col">
            <ContactForm
              form={content.form}
              mailTo={content.formMailTo ?? contactFormMailto()}
              className="min-h-0 flex-1 flex-col"
            />
          </aside>
        </div>

        {content.footnote ? (
          <p className="mt-14 max-w-3xl text-xs leading-relaxed text-white/40">
            {content.footnote}
          </p>
        ) : null}
      </Container>
    </div>
  );
}
