import type { Metadata } from "next";

import { legalPathForLocale, type LegalLocale } from "./types";

type MetaSource = {
  metaTitle: string;
  metaDescription: string;
  path: string;
};

export function legalPageMetadata(source: MetaSource, locale: LegalLocale): Metadata {
  const canonicalPath = legalPathForLocale(source.path, locale);
  return {
    title: source.metaTitle,
    description: source.metaDescription,
    alternates: {
      canonical: canonicalPath,
      languages: {
        et: legalPathForLocale(source.path, "et"),
        en: legalPathForLocale(source.path, "en"),
        ru: legalPathForLocale(source.path, "ru"),
      },
    },
  };
}
