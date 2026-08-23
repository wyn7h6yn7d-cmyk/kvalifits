import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  HOMEPAGE_SEO_TITLE,
  SITE_ALTERNATE_NAME,
  SITE_NAME,
  SITE_ORIGIN,
  homepageBrandMetadata,
  websiteJsonLd,
} from "./site.ts";
import { buildJobSeoTitle } from "../jobs/jobSeo.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

describe("homepage brand SEO", () => {
  it("uses www canonical origin and Kvalifits site name", () => {
    assert.equal(SITE_NAME, "Kvalifits");
    assert.equal(SITE_ALTERNATE_NAME, "kvalifits.ee");
    assert.equal(SITE_ORIGIN, "https://www.kvalifits.ee");
  });

  it("builds absolute homepage title for every locale without template suffix", () => {
    for (const locale of ["et", "en", "ru"] as const) {
      const meta = homepageBrandMetadata({
        locale,
        description: "Test description",
      });
      assert.deepEqual(meta.title, { absolute: HOMEPAGE_SEO_TITLE });
      assert.equal(meta.openGraph?.siteName, SITE_NAME);
      assert.equal(meta.openGraph?.title, HOMEPAGE_SEO_TITLE);
      assert.equal(meta.twitter?.title, HOMEPAGE_SEO_TITLE);
      assert.equal(meta.openGraph?.url, `${SITE_ORIGIN}/${locale}`);
      assert.equal(
        (meta.alternates as { canonical?: string } | undefined)?.canonical,
        `${SITE_ORIGIN}/${locale}`,
      );
      assert.doesNotMatch(HOMEPAGE_SEO_TITLE, / · Kvalifits$/);
    }
  });

  it("emits WebSite JSON-LD with Kvalifits name and canonical url", () => {
    const data = websiteJsonLd();
    assert.equal(data["@type"], "WebSite");
    assert.equal(data.name, SITE_NAME);
    assert.equal(data.alternateName, SITE_ALTERNATE_NAME);
    assert.equal(data.url, `${SITE_ORIGIN}/`);
  });

  it("keeps descriptive job titles distinct from homepage brand title", () => {
    const title = buildJobSeoTitle({
      locale: "et",
      title: "Plekksepp",
      location: "Tallinn",
      companyName: "peremees OÜ",
      emptyTitle: "Tööpakkumine",
    });
    assert.match(title, /Plekksepp/);
    assert.match(title, /peremees OÜ/);
    assert.match(title, /Kvalifits/);
    assert.notEqual(title, HOMEPAGE_SEO_TITLE);
  });

  it("ships crawlable brand favicon assets", () => {
    const assets = [
      "public/favicon-48.png",
      "public/favicon-96.png",
      "public/favicon-192.png",
      "public/favicon-v4.png",
      "public/favicon-v4.ico",
      "public/favicon.ico",
      "public/apple-touch-icon.png",
      "app/favicon.ico",
      "app/icon.png",
    ];
    for (const rel of assets) {
      assert.equal(existsSync(join(root, rel)), true, `missing ${rel}`);
    }
  });
});
