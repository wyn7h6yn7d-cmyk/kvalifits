import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { expandCompanySlugsToSitemapEntries, expandJobsToSitemapEntries } from "./sitemapEntries";
import { SEO_LOCALES, SITE_ORIGIN } from "@/lib/seo/site";

describe("sitemapEntries helpers", () => {
  it("expands jobs into hreflang + locale-specific sitemap entries", () => {
    const entries = expandJobsToSitemapEntries(
      [
        { id: "job-1", lastMod: "2026-08-01T00:00:00Z" },
        { id: "job-2", lastMod: "2026-08-02T00:00:00Z" },
      ],
      { pathPrefix: "/tood", changeFrequency: "daily", priority: 0.7 },
    );

    // 2 jobs * 3 SEO locales.
    assert.equal(entries.length, 2 * SEO_LOCALES.length);

    const first = entries.find((e) => e.url.endsWith("/en/tood/job-1"));
    assert.ok(first, "expected /en/tood/job-1 entry");
    assert.equal(first?.priority, 0.7);
    assert.equal(first?.changeFrequency, "daily");
    assert.equal(first?.lastModified.toISOString(), "2026-08-01T00:00:00.000Z");
    assert.equal(first?.url, `${SITE_ORIGIN}/en/tood/job-1`);
    assert.ok(first?.alternates?.languages?.et?.endsWith("/et/tood/job-1"));
    assert.ok(first?.alternates?.languages?.en?.endsWith("/en/tood/job-1"));
    assert.ok(first?.alternates?.languages?.ru?.endsWith("/ru/tood/job-1"));
  });

  it("expands company slugs into sitemap entries without query params", () => {
    const entries = expandCompanySlugsToSitemapEntries(["acme"]);
    assert.equal(entries.length, SEO_LOCALES.length);

    const one = entries.find((e) => e.url.endsWith("/et/ettevotted/acme"));
    assert.ok(one);
    assert.equal(one?.url, `${SITE_ORIGIN}/et/ettevotted/acme`);
    assert.equal(one?.changeFrequency, "weekly");
    assert.equal(one?.priority, 0.6);
  });
});

