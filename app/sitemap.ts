import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

import {
  PUBLIC_STATIC_PATHS,
  SEO_LOCALES,
  absoluteUrl,
  hreflangLanguages,
  normalizePathWithoutLocale,
} from "@/lib/seo/site";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

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
      .select("id, published_at, created_at, expires_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error || !data?.length) {
      if (error && /published_at|expires_at|column/i.test(error.message ?? "")) {
        const legacy = await supabase
          .from("job_posts")
          .select("id, created_at")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(5000);
        if (legacy.error || !legacy.data?.length) return [];
        return expandJobs(
          legacy.data.map((j) => ({
            id: String(j.id),
            lastMod: (j.created_at as string | null) ?? undefined,
          })),
        );
      }
      return [];
    }

    const now = Date.now();
    return expandJobs(
      data
        .filter((j) => {
          const exp = (j as { expires_at?: string | null }).expires_at;
          if (!exp) return true;
          const t = new Date(exp).getTime();
          return Number.isNaN(t) || t >= now;
        })
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

function expandJobs(
  jobs: { id: string; lastMod?: string }[],
): MetadataRoute.Sitemap {
  const out: MetadataRoute.Sitemap = [];
  for (const job of jobs) {
    const path = `/tood/${job.id}`;
    const languages = hreflangLanguages(path);
    const lastModified = job.lastMod ? new Date(job.lastMod) : new Date();
    for (const locale of SEO_LOCALES) {
      out.push({
        url: absoluteUrl(locale, path),
        lastModified,
        changeFrequency: "daily",
        priority: 0.7,
        alternates: { languages },
      });
    }
  }
  return out;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPriority: Record<string, number> = {
    "": 1,
    "/tood": 0.9,
    "/toootsijatele": 0.8,
    "/tooandjatele": 0.8,
    "/kontakt": 0.6,
    "/privaatsus": 0.4,
    "/tingimused": 0.4,
    "/kupsised": 0.4,
    "/andmekaitse": 0.4,
    "/ettevote": 0.5,
  };

  const staticEntries = PUBLIC_STATIC_PATHS.flatMap((path) => {
    const p = normalizePathWithoutLocale(path);
    const priority = staticPriority[p] ?? 0.5;
    const changeFrequency =
      p === "" || p === "/tood" ? "daily" : p.startsWith("/too") ? "weekly" : "monthly";
    return staticEntry(p, priority, changeFrequency);
  });

  const jobs = await publishedJobEntries();
  return [...staticEntries, ...jobs];
}
