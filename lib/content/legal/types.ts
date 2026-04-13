/** Anchor-friendly id for TOC / deep links */
export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  listItems?: string[];
};

export type LegalDocument = {
  /** URL path without locale prefix, e.g. /privaatsus */
  path: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  lead?: string;
  /** ISO date YYYY-MM-DD */
  lastUpdated: string;
  sections: LegalSection[];
  /** Optional closing note (e.g. not legal advice) */
  footnote?: string;
};

export type ContactBlock = {
  title: string;
  lines: string[];
  /** Optional header icon in the contact page cards */
  icon?: "building2" | "mail" | "clock" | "phone" | "share2";
  /** Column span on sm+ grid (default 1) */
  span?: 1 | 2;
};

export type ContactPageContent = {
  path: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  lead: string;
  lastUpdated: string;
  blocks: ContactBlock[];
  form: {
    nameLabel: string;
    emailLabel: string;
    subjectLabel: string;
    messageLabel: string;
    submitLabel: string;
    privacyHint: string;
    successNote: string;
  };
  /** Short heading above the mailto form (right column) */
  formAside?: {
    title: string;
    lead: string;
  };
  /** Mailto recipient when displayed emails use placeholders like [e-post]. */
  formMailTo?: string;
  footnote?: string;
};

export type CompanyPageContent = {
  path: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  lead: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export type LegalDocId =
  | "privacy"
  | "terms"
  | "cookies"
  | "dataRights"
  | "company";

export const LEGAL_DOC_PATHS: Record<LegalDocId, string> = {
  privacy: "/privaatsus",
  terms: "/tingimused",
  cookies: "/kupsised",
  dataRights: "/andmekaitse",
  company: "/ettevote",
};

export type LegalLocale = "et" | "en" | "ru";

/** Täielik URL tee (kõik keeled `localePrefix: "always"` all). */
export function legalPathForLocale(path: string, locale: LegalLocale): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (locale === "et") return `/et${p}`;
  if (locale === "en") return `/en${p}`;
  return `/ru${p}`;
}
