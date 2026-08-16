import type { Metadata } from "next";

import { publicPageMetadata } from "@/lib/seo/site";
import type { LegalLocale } from "./types";

type MetaSource = {
  metaTitle: string;
  metaDescription: string;
  path: string;
};

export function legalPageMetadata(source: MetaSource, locale: LegalLocale): Metadata {
  return publicPageMetadata({
    locale,
    path: source.path,
    title: source.metaTitle,
    description: source.metaDescription,
  });
}
