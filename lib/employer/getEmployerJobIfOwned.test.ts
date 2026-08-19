import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getEmployerJobIfOwned } from "./getEmployerJobIfOwned.ts";

type QueryResult = { data: unknown; error: { message: string } | null };

function tableClient(tables: Record<string, QueryResult>) {
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

const jobRow = {
  id: "job-a",
  title: "Nurse",
  employer_profile_id: "ep-a",
  location: "Tallinn",
  work_type: "on_site",
  job_type: "full_time",
  short_summary: null,
  description: null,
  requirements: null,
  requirement_lines: null,
  required_skills: null,
  keywords: null,
  experience_level_required: null,
  certificate_requirements: null,
};

describe("employer job ownership", () => {
  it("returns the job when the viewer owns the employer profile", async () => {
    const supabase = tableClient({
      job_posts: { data: jobRow, error: null },
      employer_profiles: { data: { id: "ep-a" }, error: null },
    });
    const owned = await getEmployerJobIfOwned(supabase as never, "employer-a", "job-a");
    assert.ok(owned);
    assert.equal(owned.id, "job-a");
  });

  it("returns a draft job when the viewer owns the employer profile", async () => {
    const supabase = tableClient({
      job_posts: { data: { ...jobRow, status: "draft" }, error: null },
      employer_profiles: { data: { id: "ep-a" }, error: null },
    });
    const owned = await getEmployerJobIfOwned(supabase as never, "employer-a", "job-a");
    assert.ok(owned);
    assert.equal(owned.id, "job-a");
  });

  it("rejects another employer's draft", async () => {
    const supabase = tableClient({
      job_posts: { data: { ...jobRow, status: "draft" }, error: null },
      employer_profiles: { data: null, error: null },
    });
    const owned = await getEmployerJobIfOwned(supabase as never, "employer-b", "job-a");
    assert.equal(owned, null);
  });

  it("rejects another employer's job", async () => {
    const supabase = tableClient({
      job_posts: { data: jobRow, error: null },
      employer_profiles: { data: null, error: null },
    });
    const owned = await getEmployerJobIfOwned(supabase as never, "employer-b", "job-a");
    assert.equal(owned, null);
  });
});
