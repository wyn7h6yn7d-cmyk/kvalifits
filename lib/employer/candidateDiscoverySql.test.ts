import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const sql = readFileSync(
  join(root, "supabase/migrations/20260819170000_search_discoverable_candidates.sql"),
  "utf8",
);

describe("discoverable candidate SQL: security and query plan", () => {
  it("uses security invoker so RLS still applies", () => {
    assert.match(sql, /security invoker/i);
    assert.doesNotMatch(sql, /security definer/i);
  });

  it("is executable by authenticated employers only, not anon", () => {
    assert.match(sql, /grant execute on function public\.search_discoverable_candidates[\s\S]*to authenticated/i);
    assert.match(sql, /revoke all on function public\.search_discoverable_candidates[\s\S]*from anon/i);
    assert.match(sql, /revoke all on function public\.search_discoverable_candidates[\s\S]*from public/i);
  });

  it("gates results on an employer_profiles row for auth.uid()", () => {
    assert.match(sql, /employer_profiles ep/);
    assert.match(sql, /ep\.owner_user_id = auth\.uid\(\)/);
  });

  it("caps page size at 30 and defaults to 24", () => {
    assert.match(sql, /p_page_size integer default 24/);
    assert.match(sql, /least\(greatest\(coalesce\(p_page_size, 24\), 1\), 30\)/);
  });

  it("returns total_count and page info with the current page only", () => {
    assert.match(sql, /'total_count'/);
    assert.match(sql, /'current_page'/);
    assert.match(sql, /'total_pages'/);
    assert.match(sql, /'page_size'/);
    assert.match(sql, /offset \(v_page - 1\) \* v_size/);
    assert.match(sql, /limit v_size/);
  });

  it("sorts newest updated_at first on the server", () => {
    assert.match(sql, /order by m\.updated_at desc nulls last, m\.user_id/);
  });

  it("adds indexes that match the reviewed plan: visible updated_at and complete certs", () => {
    assert.match(
      sql,
      /create index if not exists seeker_profiles_discoverable_updated_idx[\s\S]*updated_at desc nulls last, user_id[\s\S]*profile_visible = true/,
    );
    assert.match(
      sql,
      /create index if not exists seeker_certificates_discoverable_user_idx[\s\S]*on public\.seeker_certificates \(user_id\)/,
    );
    assert.doesNotMatch(sql, /using gin \(skills\)/);
    assert.doesNotMatch(sql, /using gin \(languages\)/);
  });

  it("projects only discoverable profile and certificate metadata", () => {
    assert.match(sql, /'full_name', sp\.full_name/);
    assert.match(sql, /'verification_status', sc\.verification_status/);
    assert.doesNotMatch(sql, /'phone'/);
    assert.doesNotMatch(sql, /'cv_url'/);
    assert.doesNotMatch(sql, /'date_of_birth'/);
    assert.doesNotMatch(sql, /'certificate_image_url'/);
    assert.doesNotMatch(sql, /'certificate_number'/);
    assert.doesNotMatch(sql, /'salary_expectation'/);
    assert.doesNotMatch(sql, /'work_authorization_notes'/);
    assert.doesNotMatch(sql, /seeker_work_capacity/);
    assert.doesNotMatch(sql, /seeker_workplace_needs/);
    const searchFn = sql.slice(sql.indexOf("create or replace function public.search_discoverable_candidates"));
    assert.doesNotMatch(searchFn, /'about'/);
  });
});
