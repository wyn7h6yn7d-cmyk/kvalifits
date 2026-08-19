import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getEmployerJobIfOwned } from "../employer/getEmployerJobIfOwned.ts";
import {
  buildDuplicatedJobPost,
  canDuplicateEmployerJob,
  safeDuplicateApplicationDeadline,
} from "./duplicateJobPost.ts";

const asOf = new Date("2026-08-18T12:00:00Z");

const source = {
  id: "job-a",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-08-01T00:00:00Z",
  slug: "nurse-oldslug",
  status: "published",
  published_at: "2026-01-10T00:00:00Z",
  expires_at: "2026-02-09T21:59:59.999+02:00",
  application_deadline: "2026-02-01",
  search_text: "nurse tallinn",
  search_tsv: "tsvector-payload",
  view_count: 440,
  impressions: 1200,
  moderation_status: "removed",
  employer_profile_id: "ep-a",
  created_by: "employer-a",
  title: "Nurse",
  location: "Tallinn",
  work_type: "on_site",
  job_type: "full_time",
  short_summary: "Clinic nurse for day shifts.",
  description: "Full description of duties, team, and working environment for this role.",
  duty_lines: ["Patient care", "Shift handover"],
  benefit_lines: ["Health insurance"],
  requirements: "Licence\nEstonian",
  requirement_lines: ["Valid nursing licence", "Estonian language"],
  job_requirements: [{ text: "Valid nursing licence", priority: "mandatory" }],
  required_skills: ["Nursing"],
  keywords: ["healthcare"],
  experience_level_required: "mid",
  certificate_requirements: "Nursing licence",
  languages: ["Estonian"],
  industry_id: "ind-health",
  profession_id: "prof-nurse",
  skill_ids: ["sk-nursing"],
  certificate_ids: ["cert-nurse"],
  language_ids: ["lang-et"],
  weekly_hours: 40,
  daily_hours: 8,
  shift_start: "08:00",
  shift_end: "16:00",
  includes_night_work: false,
  is_hazardous_work: false,
  salary_mode: "range",
  salary_min: 1800,
  salary_max: 2400,
  salary_tax: "bruto",
  salary_period: "month",
  salary_currency: "EUR",
  start_date: "2026-09-01",
};

describe("employer job duplication", () => {
  it("copies listing content into a new draft without identity or lifecycle", () => {
    const copy = buildDuplicatedJobPost({
      source,
      createdBy: "employer-a",
      now: asOf,
      slugSuffix: "abc123",
    });

    assert.equal(copy.title, "Nurse");
    assert.equal(copy.description, source.description);
    assert.deepEqual(copy.duty_lines, source.duty_lines);
    assert.deepEqual(copy.benefit_lines, source.benefit_lines);
    assert.deepEqual(copy.requirement_lines, source.requirement_lines);
    assert.deepEqual(copy.job_requirements, source.job_requirements);
    assert.deepEqual(copy.required_skills, ["Nursing"]);
    assert.equal(copy.certificate_requirements, "Nursing licence");
    assert.deepEqual(copy.languages, ["Estonian"]);
    assert.deepEqual(copy.skill_ids, ["sk-nursing"]);
    assert.deepEqual(copy.certificate_ids, ["cert-nurse"]);
    assert.deepEqual(copy.language_ids, ["lang-et"]);
    assert.equal(copy.work_type, "on_site");
    assert.equal(copy.job_type, "full_time");
    assert.equal(copy.weekly_hours, 40);
    assert.equal(copy.salary_mode, "range");
    assert.equal(copy.salary_min, 1800);
    assert.equal(copy.salary_max, 2400);
    assert.equal(copy.shift_start, "08:00");
    assert.equal(copy.shift_end, "16:00");
    assert.equal(copy.start_date, "2026-09-01");

    assert.equal(copy.status, "draft");
    assert.equal(copy.published_at, null);
    assert.equal(copy.expires_at, null);
    assert.equal(copy.employer_profile_id, "ep-a");
    assert.equal(copy.created_by, "employer-a");
    assert.equal(copy.slug, "nurse-abc123");

    assert.equal("id" in copy, false);
    assert.notEqual(copy.slug, source.slug);
    assert.equal("search_text" in copy, false);
    assert.equal("search_tsv" in copy, false);
    assert.equal("view_count" in copy, false);
    assert.equal("impressions" in copy, false);
    assert.equal("moderation_status" in copy, false);
    assert.equal("created_at" in copy, false);
  });

  it("does not reuse an expired or missing deadline", () => {
    assert.equal(safeDuplicateApplicationDeadline("2026-01-01", asOf), "2026-09-17");
    assert.equal(safeDuplicateApplicationDeadline(null, asOf), "2026-09-17");
    const copy = buildDuplicatedJobPost({
      source,
      createdBy: "employer-a",
      now: asOf,
      slugSuffix: "x",
    });
    assert.equal(copy.application_deadline, "2026-09-17");
    assert.notEqual(copy.application_deadline, source.application_deadline);
  });

  it("keeps a still-valid source deadline", () => {
    assert.equal(safeDuplicateApplicationDeadline("2026-12-31", asOf), "2026-12-31");
    const copy = buildDuplicatedJobPost({
      source: { ...source, application_deadline: "2026-12-31" },
      createdBy: "employer-a",
      now: asOf,
      slugSuffix: "x",
    });
    assert.equal(copy.application_deadline, "2026-12-31");
  });

  it("allows only the job owner to duplicate", () => {
    assert.equal(
      canDuplicateEmployerJob({ viewerUserId: "employer-a", ownerUserId: "employer-a" }),
      true,
    );
    assert.equal(
      canDuplicateEmployerJob({ viewerUserId: "employer-b", ownerUserId: "employer-a" }),
      false,
    );
    assert.equal(canDuplicateEmployerJob({ viewerUserId: null, ownerUserId: "employer-a" }), false);
  });
});

describe("duplicate ownership uses the same owner gate as job load", () => {
  function tableClient(tables: Record<string, { data: unknown; error: { message: string } | null }>) {
    return {
      from(name: string) {
        const result = tables[name] ?? { data: null, error: { message: `unexpected table ${name}` } };
        const builder = {
          select() {
            return builder;
          },
          eq() {
            return builder;
          },
          maybeSingle() {
            return Promise.resolve(result);
          },
        };
        return builder;
      },
    };
  }

  it("owner can load a published job to duplicate", async () => {
    const supabase = tableClient({
      job_posts: { data: { id: "job-a", employer_profile_id: "ep-a", status: "published" }, error: null },
      employer_profiles: { data: { id: "ep-a" }, error: null },
    });
    const owned = await getEmployerJobIfOwned(supabase as never, "employer-a", "job-a");
    assert.ok(owned);
    assert.equal(
      canDuplicateEmployerJob({ viewerUserId: "employer-a", ownerUserId: "employer-a" }),
      true,
    );
  });

  it("non-owner cannot load another employer's job to duplicate", async () => {
    const supabase = tableClient({
      job_posts: { data: { id: "job-a", employer_profile_id: "ep-a", status: "published" }, error: null },
      employer_profiles: { data: null, error: null },
    });
    const owned = await getEmployerJobIfOwned(supabase as never, "employer-b", "job-a");
    assert.equal(owned, null);
    assert.equal(
      canDuplicateEmployerJob({ viewerUserId: "employer-b", ownerUserId: "employer-a" }),
      false,
    );
  });
});
