import { buildCookiePolicy } from "@/lib/cookies/buildCookiePolicy";
import { companyEN } from "./company.en";
import { companyET } from "./company.et";
import { companyRU } from "./company.ru";
import { contactEN } from "./contact.en";
import { contactET } from "./contact.et";
import { contactRU } from "./contact.ru";
import { dataRightsEN } from "./data-rights.en";
import { dataRightsET } from "./data-rights.et";
import { dataRightsRU } from "./data-rights.ru";
import { privacyEN } from "./privacy.en";
import { privacyET } from "./privacy.et";
import { privacyRU } from "./privacy.ru";
import { termsEN } from "./terms.en";
import { termsET } from "./terms.et";
import { termsRU } from "./terms.ru";
import type { CompanyPageContent, ContactPageContent, LegalDocument, LegalLocale } from "./types";

export type {
  CompanyPageContent,
  ContactBlock,
  ContactPageContent,
  LegalDocument,
  LegalLocale,
  LegalSection,
} from "./types";
export { LEGAL_DOC_PATHS, legalPathForLocale, type LegalDocId } from "./types";
export { PL } from "./placeholders";

const privacyByLocale: Record<LegalLocale, LegalDocument> = {
  et: privacyET,
  en: privacyEN,
  ru: privacyRU,
};

const termsByLocale: Record<LegalLocale, LegalDocument> = {
  et: termsET,
  en: termsEN,
  ru: termsRU,
};

const dataRightsByLocale: Record<LegalLocale, LegalDocument> = {
  et: dataRightsET,
  en: dataRightsEN,
  ru: dataRightsRU,
};

const companyByLocale: Record<LegalLocale, CompanyPageContent> = {
  et: companyET,
  en: companyEN,
  ru: companyRU,
};

const contactByLocale: Record<LegalLocale, ContactPageContent> = {
  et: contactET,
  en: contactEN,
  ru: contactRU,
};

export const LEGAL_LOCALES: readonly LegalLocale[] = ["et", "en", "ru"];

export function getPrivacyPolicy(locale: LegalLocale): LegalDocument {
  return privacyByLocale[locale];
}

export function getTerms(locale: LegalLocale): LegalDocument {
  return termsByLocale[locale];
}

/** Built from `lib/cookies/config` — same source as the consent UI. */
export function getCookiePolicy(locale: LegalLocale): LegalDocument {
  return buildCookiePolicy(locale);
}

export function getDataRightsPage(locale: LegalLocale): LegalDocument {
  return dataRightsByLocale[locale];
}

export function getCompanyPage(locale: LegalLocale): CompanyPageContent {
  return companyByLocale[locale];
}

export function getContactPage(locale: LegalLocale): ContactPageContent {
  return contactByLocale[locale];
}

export { legalPageMetadata } from "./metadata";
