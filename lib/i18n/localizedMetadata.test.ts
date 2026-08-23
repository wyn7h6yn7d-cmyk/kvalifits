import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { errorCopyForLocale, localeFromCookieHeader } from "./errorCopy.ts";
import { buildCompanySeoTitle } from "../companies/companySeo.ts";
import { buildJobSeoDescription, buildJobSeoTitle } from "../jobs/jobSeo.ts";
import { noindexLocalizedMetadata } from "../seo/site.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function loadMessages(locale: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(root, "messages", `${locale}.json`), "utf8")) as Record<
    string,
    unknown
  >;
}

function at(obj: Record<string, unknown>, path: string): string {
  const value = path.split(".").reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
  return typeof value === "string" ? value : "";
}

describe("localized missing metadata and error copy", () => {
  it("keeps company/job/not-found metadata in ET, EN, and RU", () => {
    const keys = [
      "metadata.companyMissingTitle",
      "metadata.companyMissingDescription",
      "metadata.jobMissingTitle",
      "metadata.jobMissingDescription",
      "metadata.notFoundTitle",
      "metadata.notFoundDescription",
      "metadata.companyFallbackName",
      "metadata.jobFallbackTitle",
      "errors.notFoundTitle",
      "errors.notFoundBody",
      "errors.notFoundHome",
    ];
    for (const locale of ["et", "en", "ru"]) {
      const messages = loadMessages(locale);
      for (const key of keys) {
        const value = at(messages, key);
        assert.ok(value.trim().length > 0, `${locale} missing ${key}`);
      }
    }
    assert.notEqual(at(loadMessages("et"), "metadata.companyMissingTitle"), at(loadMessages("en"), "metadata.companyMissingTitle"));
    assert.notEqual(at(loadMessages("en"), "metadata.jobMissingTitle"), at(loadMessages("ru"), "metadata.jobMissingTitle"));
    assert.notEqual(at(loadMessages("et"), "errors.notFoundTitle"), at(loadMessages("en"), "errors.notFoundTitle"));
  });

  it("does not hardcode Estonian company missing metadata", () => {
    const src = readFileSync(join(root, "app/[locale]/(site)/ettevotted/[slug]/page.tsx"), "utf8");
    assert.equal(src.includes("Ettevõte | Kvalifits"), false);
    assert.match(src, /t\("companyMissingTitle"\)/);
    assert.match(src, /noindexLocalizedMetadata/);
  });

  it("uses next-intl for missing job metadata instead of locale ternaries", () => {
    const src = readFileSync(join(root, "app/[locale]/(site)/tood/[id]/page.tsx"), "utf8");
    assert.equal(src.includes("Job | Kvalifits"), false);
    assert.equal(src.includes("Tööpakkumine | Kvalifits"), false);
    assert.match(src, /t\("jobMissingTitle"\)/);
    assert.match(src, /noindexLocalizedMetadata/);
  });

  it("sets localized Open Graph fallback titles on noindex metadata", () => {
    const et = noindexLocalizedMetadata({
      locale: "et",
      title: "Ettevõte | Kvalifits",
      description: "Seda ettevõtet ei ole.",
      path: "/ettevotted/missing",
    });
    const en = noindexLocalizedMetadata({
      locale: "en",
      title: "Company | Kvalifits",
      description: "This company page is not available.",
      path: "/ettevotted/missing",
    });
    const ru = noindexLocalizedMetadata({
      locale: "ru",
      title: "Вакансия | Kvalifits",
      description: "Эта вакансия недоступна.",
      path: "/tood/missing",
    });
    assert.equal(et.openGraph?.title, "Ettevõte | Kvalifits");
    assert.equal(et.openGraph?.locale, "et_EE");
    assert.equal(en.openGraph?.title, "Company | Kvalifits");
    assert.equal(en.openGraph?.locale, "en_GB");
    assert.equal(ru.openGraph?.title, "Вакансия | Kvalifits");
    assert.equal(ru.openGraph?.locale, "ru_RU");
    assert.deepEqual(et.robots, { index: false, follow: false, googleBot: { index: false, follow: false } });
  });

  it("uses translated fallbacks for empty company and job SEO fields", () => {
    assert.equal(
      buildCompanySeoTitle("en", { name: "  ", location: null } as never, "Company"),
      "Company",
    );
    assert.equal(
      buildJobSeoTitle({
        locale: "ru",
        title: "",
        location: "",
        companyName: "",
        emptyTitle: "Вакансия",
      }),
      "Вакансия | Kvalifits",
    );
    assert.equal(
      buildJobSeoDescription({
        title: "",
        location: "",
        companyName: "",
        shortSummary: "",
        description: "",
        emptyDescription: "Job on Kvalifits",
      }),
      "Job on Kvalifits",
    );
  });

  it("matches global error-boundary copy to next-intl errors messages", () => {
    for (const locale of ["et", "en", "ru"] as const) {
      const copy = errorCopyForLocale(locale);
      const messages = loadMessages(locale);
      assert.equal(copy.title, at(messages, "errors.title"));
      assert.equal(copy.body, at(messages, "errors.body"));
      assert.equal(copy.retry, at(messages, "errors.retry"));
    }
    assert.equal(localeFromCookieHeader("NEXT_LOCALE=en; Path=/"), "en");
    assert.equal(localeFromCookieHeader("NEXT_LOCALE=ru"), "ru");
    assert.equal(localeFromCookieHeader(""), "et");
  });
});
