import type { MetadataRoute } from "next";

import { SEO_LOCALES, absoluteUrl, hreflangLanguages } from "@/lib/seo/site";

type SitemapJobRow = { id: string; lastMod?: string };

export function expandJobsToSitemapEntries(
  jobs: SitemapJobRow[],
  opts?: {
    pathPrefix?: string;
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority?: number;
  },
): MetadataRoute.Sitemap {
  const pathPrefix = opts?.pathPrefix ?? "/tood";
  const changeFrequency = opts?.changeFrequency ?? "daily";
  const priority = opts?.priority ?? 0.7;

  const out: MetadataRoute.Sitemap = [];

  for (const job of jobs) {
    const path = `${pathPrefix}/${job.id}`;
    const languages = hreflangLanguages(path);
    const lastModified = job.lastMod ? new Date(job.lastMod) : new Date();
    for (const locale of SEO_LOCALES) {
      out.push({
        url: absoluteUrl(locale, path),
        lastModified,
        changeFrequency,
        priority,
        alternates: { languages },
      });
    }
  }

  return out;
}

export function expandCompanySlugsToSitemapEntries(
  slugs: string[],
  opts?: {
    pathPrefix?: string;
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority?: number;
  },
): MetadataRoute.Sitemap {
  const pathPrefix = opts?.pathPrefix ?? "/ettevotted";
  const changeFrequency = opts?.changeFrequency ?? "weekly";
  const priority = opts?.priority ?? 0.6;

  const out: MetadataRoute.Sitemap = [];

  for (const slug of slugs) {
    const path = `${pathPrefix}/${slug}`;
    const languages = hreflangLanguages(path);
    const lastModified = new Date();
    for (const locale of SEO_LOCALES) {
      out.push({
        url: absoluteUrl(locale, path),
        lastModified,
        changeFrequency,
        priority,
        alternates: { languages },
      });
    }
  }

  return out;
}

