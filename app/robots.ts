import type { MetadataRoute } from "next";

import {
  NOINDEX_PATH_PREFIXES,
  SEO_LOCALES,
  SITE_ORIGIN,
} from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const disallow = SEO_LOCALES.flatMap((locale) =>
    NOINDEX_PATH_PREFIXES.map((prefix) => `/${locale}${prefix}`),
  );

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow,
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
