import { companyEN } from "./company.en";
import { companyET } from "./company.et";
import { contactEN } from "./contact.en";
import { contactET } from "./contact.et";
import { contactRU } from "./contact.ru";
import { cookiesEN } from "./cookies.en";
import { cookiesET } from "./cookies.et";
import { dataRightsEN } from "./data-rights.en";
import { dataRightsET } from "./data-rights.et";
import { privacyEN } from "./privacy.en";
import { privacyET } from "./privacy.et";
import { termsEN } from "./terms.en";
import { termsET } from "./terms.et";
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

/** RU: ajutiselt inglise tekst; asenda hiljem eraldi *.ru.ts tõlgetega. */
const privacyByLocale: Record<LegalLocale, LegalDocument> = {
  et: privacyET,
  en: privacyEN,
  ru: privacyEN,
};

const termsByLocale: Record<LegalLocale, LegalDocument> = {
  et: termsET,
  en: termsEN,
  ru: termsEN,
};

const cookiesByLocale: Record<LegalLocale, LegalDocument> = {
  et: cookiesET,
  en: cookiesEN,
  ru: cookiesEN,
};

const dataRightsByLocale: Record<LegalLocale, LegalDocument> = {
  et: dataRightsET,
  en: dataRightsEN,
  ru: dataRightsEN,
};

const companyByLocale: Record<LegalLocale, CompanyPageContent> = {
  et: companyET,
  en: companyEN,
  ru: companyEN,
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

export function getCookiePolicy(locale: LegalLocale): LegalDocument {
  return cookiesByLocale[locale];
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
