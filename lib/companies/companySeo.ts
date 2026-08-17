import type { Metadata } from "next";

import type { PublicCompany } from "@/lib/companies/publicCompany";
import {
  SITE_NAME,
  absoluteUrl,
  localeAlternates,
  ogAlternateLocales,
  ogLocaleTag,
} from "@/lib/seo/site";

function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

export function companyCanonicalPath(slug: string): string {
  return `/ettevotted/${slug}`;
}

export function buildCompanySeoTitle(locale: string, company: PublicCompany): string {
  const name = company.name.trim() || "Ettevõte";
  const loc = (company.location ?? "").trim();
  if (locale === "en") {
    return loc ? `${name} — ${loc}` : name;
  }
  if (locale === "ru") {
    return loc ? `${name} — ${loc}` : name;
  }
  return loc ? `${name} — ${loc}` : name;
}

export function buildCompanySeoDescription(locale: string, company: PublicCompany): string {
  const desc = (company.description ?? "").trim();
  if (desc) return clip(desc, 160);

  const bits = [company.name.trim()];
  if (company.industry) bits.push(company.industry);
  if (company.location) bits.push(company.location);

  if (locale === "en") {
    return clip(`${bits.join(" · ")}. Open jobs on Kvalifits.`, 160);
  }
  if (locale === "ru") {
    return clip(`${bits.join(" · ")}. Актуальные вакансии на Kvalifits.`, 160);
  }
  return clip(`${bits.join(" · ")}. Aktiivsed tööpakkumised Kvalifitsis.`, 160);
}

export function buildCompanyMetadata(opts: {
  locale: string;
  company: PublicCompany;
  title: string;
  description: string;
}): Metadata {
  const path = companyCanonicalPath(opts.company.slug);
  const url = absoluteUrl(opts.locale, path);
  const images = opts.company.logoUrl
    ? [{ url: opts.company.logoUrl, alt: opts.company.name }]
    : undefined;

  return {
    title: { absolute: `${opts.title} · ${SITE_NAME}` },
    description: opts.description,
    alternates: localeAlternates(opts.locale, path),
    openGraph: {
      type: "website",
      url,
      siteName: SITE_NAME,
      locale: ogLocaleTag(opts.locale),
      alternateLocale: ogAlternateLocales(opts.locale),
      title: opts.title,
      description: opts.description,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary",
      title: opts.title,
      description: opts.description,
    },
  };
}
