import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

import {
  PUBLIC_STATIC_PATHS,
  SEO_LOCALES,
  absoluteUrl,
  hreflangLanguages,
  normalizePathWithoutLocale,
} from "@/lib/seo/site";
import { jobAcceptsApplications } from "@/lib/jobs/jobLifecycle";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { expandCompanySlugsToSitemapEntries, expandJobsToSitemapEntries } from "@/lib/seo/sitemapEntries";

function staticEntry(
  pathWithoutLocale: string,
  priority: number,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
): MetadataRoute.Sitemap {
  const path = normalizePathWithoutLocale(pathWithoutLocale);
  const languages = hreflangLanguages(path);

  return SEO_LOCALES.map((locale) => ({
    url: absoluteUrl(locale, path),
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: { languages },
  }));
}

function createPublicSupabase() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function publishedJobEntries(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("job_posts")
      .select("id, published_at, created_at, expires_at, application_deadline, status")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error || !data?.length) {
      if (error && /published_at|expires_at|application_deadline|column/i.test(error.message ?? "")) {
        const legacy = await supabase
          .from("job_posts")
          .select("id, created_at")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(5000);
        if (legacy.error || !legacy.data?.length) return [];
        return expandJobsToSitemapEntries(
          legacy.data.map((j) => ({
            id: String(j.id),
            lastMod: (j.created_at as string | null) ?? undefined,
          })),
        );
      }
      return [];
    }

    return expandJobsToSitemapEntries(
      data
        .filter((j) =>
          jobAcceptsApplications({
            status: "published",
            published_at: (j.published_at as string | null) ?? null,
            application_deadline: (j.application_deadline as string | null) ?? null,
            expires_at: (j.expires_at as string | null) ?? null,
          }),
        )
        .map((j) => ({
          id: String(j.id),
          lastMod:
            (j.published_at as string | null) ||
            (j.created_at as string | null) ||
            undefined,
        })),
    );
  } catch {
    return [];
  }
}

async function publicCompanyEntries(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicSupabase();
  if (!supabase) return [];

  try {
    const fromView = await supabase
      .from("employer_public_profiles")
      .select("public_slug")
      .limit(2000);
    let slugs: string[] = [];
    if (!fromView.error) {
      slugs = (fromView.data ?? [])
        .map((r) => (r.public_slug ?? "").toString().trim())
        .filter(Boolean);
    } else {
      // Do not fall back to all employer_profiles slugs — that can include
      // companies without an active public listing.
      return [];
    }

    return expandCompanySlugsToSitemapEntries(slugs);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPriority: Record<string, number> = {
    "": 1,
    "/tood": 0.9,
    "/toootsijatele": 0.8,
    "/tooandjatele": 0.8,
    "/kkk": 0.6,
    "/kontakt": 0.6,
    "/privaatsus": 0.4,
    "/tingimused": 0.4,
    "/kupsised": 0.4,
    "/andmekaitse": 0.4,
    "/ettevote": 0.5,
    "/ettevotted": 0.8,
  };

  const staticEntries = PUBLIC_STATIC_PATHS.flatMap((path) => {
    const p = normalizePathWithoutLocale(path);
    const priority = staticPriority[p] ?? 0.5;
    const changeFrequency =
      p === "" || p === "/tood"
        ? "daily"
        : p === "/ettevotted" || p.startsWith("/too")
          ? "weekly"
          : "monthly";
    return staticEntry(p, priority, changeFrequency);
  });

  const jobs = await publishedJobEntries();
  const companies = await publicCompanyEntries();
  return [...staticEntries, ...jobs, ...companies];
}
