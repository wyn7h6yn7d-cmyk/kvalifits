import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildJobDetailPageMetadata,
  buildJobPostingJsonLd,
  buildJobSeoDescription,
  buildJobSeoTitle,
  jobCanonicalUrl,
  jobHreflangLanguages,
  jobLocaleAlternates,
} from "@/lib/jobs/jobSeo";
import { SITE_ORIGIN } from "@/lib/seo/site";

function baseActiveJob() {
  return {
    id: "job-123",
    title: "Test Job Title",
    location: "Tallinn",
    job_type: "full_time",
    work_type: "remote",
    short_summary: "Short summary",
    description: "<p>Long description</p>",
    status: "published",
    created_at: "2090-01-01T00:00:00Z",
    published_at: "2099-01-01T00:00:00Z",
    application_deadline: "2099-12-31",
    expires_at: "2099-12-31T21:59:59Z",
    salary_min: 1000,
    salary_max: 2000,
    salary_currency: "eur",
    salary_tax: null,
    salary_period: "month",
  } as const;
}

function baseEmployer() {
  return {
    company_name: "ACME OÜ",
    website: "https://acme.example",
    logo_url: "https://acme.example/logo.png",
    location: "Tallinn",
    public_slug: "acme",
  };
}

describe("SEO JobPosting JSON-LD lifecycle & field completeness", () => {
  it("emits a complete JobPosting for active/published jobs", () => {
    const job = baseActiveJob();
    const json = buildJobPostingJsonLd({ locale: "en", job: job as never, employer: baseEmployer() as never });
    assert.ok(json, "expected JSON-LD");
    assert.equal(json?.["@type"], "JobPosting");

    // Required fields that should exist for an open listing.
    assert.equal(json?.title, "Test Job Title");
    assert.ok(typeof json?.description === "string" && (json?.description as string).includes("Short summary"));
    assert.ok(typeof json?.datePosted === "string");
    assert.ok(json?.hiringOrganization?.name === "ACME OÜ");
    assert.ok(typeof json?.url === "string" && json?.url?.toString().includes("/en/tood/job-123"));

    // Optional fields should only exist when supported.
    assert.ok(typeof json?.validThrough === "string", "validThrough should be emitted for active jobs");
    assert.equal(json?.employmentType, "FULL_TIME");

    // Remote jobs should include TELECOMMUTE (and may include jobLocation when location is visible).
    assert.equal(json?.jobLocationType, "TELECOMMUTE");
    assert.ok(json?.jobLocation?.address?.addressLocality === "Tallinn");

    // Salary should only exist when amount + currency + period are all present.
    assert.ok(json?.baseSalary, "baseSalary should exist when salary fields are present");
  });

  it("returns null (no JobPosting JSON-LD) for expired jobs", () => {
    const job = baseActiveJob();
    const expired = {
      ...job,
      // Ensure it is expired for any reasonable test run date.
      expires_at: "2000-01-01T00:00:00Z",
      application_deadline: "2000-01-01",
    };

    const json = buildJobPostingJsonLd({
      locale: "et",
      job: expired as never,
      employer: baseEmployer() as never,
    });
    assert.equal(json, null);
  });

  it("omits baseSalary when currency or period is missing (no invented fields)", () => {
    const job = baseActiveJob();
    const missingCurrency = { ...job, salary_currency: null } as typeof job;

    const json = buildJobPostingJsonLd({
      locale: "en",
      job: missingCurrency as never,
      employer: baseEmployer() as never,
    });
    assert.ok(json, "expected JSON-LD even when salary is missing");
    assert.equal((json as Record<string, unknown>).baseSalary, undefined);
  });

  it("returns null for non-remote jobs when jobLocation is missing (no misleading structured data)", () => {
    const job = baseActiveJob();
    const onsiteNoLocation = {
      ...job,
      work_type: "on_site",
      location: null,
    };

    const json = buildJobPostingJsonLd({
      locale: "en",
      job: onsiteNoLocation as never,
      employer: baseEmployer() as never,
    });
    assert.equal(json, null);
  });

  it("includes structured requirements in JobPosting description", () => {
    const job = {
      ...baseActiveJob(),
      short_summary: "",
      description: "",
      requirement_lines: ["A-pädevus", "B-kategooria juhiluba"],
    };
    const json = buildJobPostingJsonLd({
      locale: "et",
      job: job as never,
      employer: baseEmployer() as never,
    });
    assert.ok(json);
    assert.match(String(json?.description), /A-pädevus/);
    assert.match(String(json?.description), /B-kategooria juhiluba/);
  });
});

describe("job detail metadata", () => {
  it("builds an absolute title without layout template duplication", () => {
    const title = buildJobSeoTitle({
      locale: "et",
      title: "Plekksepp",
      location: "Tallinn",
      companyName: "peremees OÜ",
      emptyTitle: "Tööpakkumine",
    });
    assert.equal(title, "Plekksepp Tallinnas – peremees OÜ | Kvalifits");

    const meta = buildJobDetailPageMetadata({
      locale: "et",
      jobId: "job-123",
      job: {
        ...baseActiveJob(),
        id: "job-123",
        title: "Plekksepp",
        location: "Tallinn",
      },
      employer: { company_name: "peremees OÜ" },
      labels: {
        emptyTitle: "Tööpakkumine",
        emptyDescription: "Tööpakkumine Kvalifitsis",
        salaryLabel: "2300 € bruto / kuu",
        applyUntilLabel: "31.12.2099",
      },
    });

    assert.deepEqual(meta.title, { absolute: title });
    assert.equal((meta.alternates as { canonical?: string } | undefined)?.canonical, jobCanonicalUrl("et", "job-123"));
    assert.equal(meta.openGraph?.title, title);
    assert.equal(meta.twitter?.title, title);
    assert.equal(title.includes("Kvalifits · Kvalifits"), false);
  });

  it("falls back to listing facts in meta description when summary is empty", () => {
    const description = buildJobSeoDescription({
      title: "Plekksepp",
      location: "Tallinn",
      companyName: "peremees OÜ",
      shortSummary: "",
      description: "",
      salaryLabel: "2300 € bruto / kuu",
      applyUntilLabel: "31.12.2099",
      requirements: ["A-pädevus"],
      emptyDescription: "Tööpakkumine Kvalifitsis",
    });
    assert.match(description, /Plekksepp/);
    assert.match(description, /Tallinn/);
    assert.match(description, /peremees OÜ/);
    assert.match(description, /2300 € bruto \/ kuu/);
    assert.match(description, /31\.12\.2099/);
  });
});

describe("SEO canonical + hreflang helpers", () => {
  it("builds stable canonical and hreflang URLs for a job", () => {
    const canonical = jobCanonicalUrl("en", "job-123");
    assert.equal(canonical, `${SITE_ORIGIN}/en/tood/job-123`);

    const alternates = jobLocaleAlternates("en", "job-123");
    assert.equal(alternates.canonical, canonical);
    assert.ok(alternates.languages.et.endsWith("/et/tood/job-123"));
    assert.ok(alternates.languages.en.endsWith("/en/tood/job-123"));
    assert.ok(alternates.languages.ru.endsWith("/ru/tood/job-123"));
    assert.ok(alternates.languages["x-default"].endsWith("/tood/job-123"));
  });

  it("exposes hreflang map for a job path", () => {
    const map = jobHreflangLanguages("job-123");
    assert.ok(map.et.endsWith("/et/tood/job-123"));
    assert.ok(map.en.endsWith("/en/tood/job-123"));
    assert.ok(map.ru.endsWith("/ru/tood/job-123"));
    assert.ok(map["x-default"].endsWith("/tood/job-123"));
  });
});

