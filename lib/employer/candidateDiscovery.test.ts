import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CANDIDATE_DISCOVERY_PAGE_SIZE,
  CANDIDATE_DISCOVERY_PAGE_SIZE_MAX,
  CANDIDATE_DISCOVERY_PAGE_SIZE_MIN,
  DISCOVERY_ALLOWED_CERTIFICATE_FIELDS,
  DISCOVERY_ALLOWED_PROFILE_FIELDS,
  DISCOVERY_FORBIDDEN_CERTIFICATE_FIELDS,
  DISCOVERY_FORBIDDEN_PROFILE_FIELDS,
  clampDiscoveryPage,
  clampDiscoveryPageSize,
  discoveryOffset,
  discoveryPageCount,
  mapDiscoveryRpcRow,
  mayLoadDiscoverableCandidates,
  parseDiscoveryRpcPayload,
  rpcArgsFromDiscoveryFilters,
  sliceDiscoveryPage,
} from "./candidateDiscovery.ts";
import {
  candidateMatchesFilters,
  emptyCandidateFilterState,
  getPublicDisplayName,
} from "./candidateFilters.ts";
import {
  buildCandidateDiscoveryUrl,
  parseCandidateDiscoveryParams,
} from "./candidateDiscoveryUrl.ts";
import { loadDiscoverableCandidates } from "./loadDiscoverableCandidates.ts";

function sampleRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "p1",
    user_id: "u1",
    full_name: "Mari Maasikas",
    location: "Tallinn",
    preferred_locations: ["Tartu"],
    experience_level: "mid",
    profile_title: "Õde",
    skills: ["Hooldus"],
    languages: ["Eesti"],
    preferred_job_types: ["Täisajaline"],
    exp_seeking_first_job: false,
    experience_duration_years: 4,
    pref_full_time: true,
    pref_part_time: false,
    pref_desired_weekly_hours: 40,
    pref_min_weekly_hours: 32,
    pref_max_weekly_hours: 40,
    pref_day_work: true,
    pref_evening_work: false,
    pref_shift_work: false,
    pref_weekend_work: false,
    pref_flexible_hours: false,
    pref_remote_work: false,
    pref_hybrid_work: false,
    pref_on_site_work: true,
    discovery_accessible_workplace: false,
    discovery_adapted_arrangement: false,
    discovery_extra_breaks: false,
    has_b_category_drivers_license: true,
    phone: "+37250000000",
    cv_url: "secret/cv.pdf",
    date_of_birth: "1990-01-01",
    about: "private about must not leak",
    certificates: [
      {
        name: "Esmaabi",
        validUntil: "2027-01-01",
        issuer: "Punane Rist",
        verification_status: "verified",
        verified_at: "2026-01-01",
        verification_source: "manual",
        certificate_image_url: "u1/certificates/secret.pdf",
        certificate_number: "SECRET-99",
      },
    ],
    ...overrides,
  };
}

describe("employer candidate discovery authorization", () => {
  it("allows only authenticated employers", () => {
    assert.equal(mayLoadDiscoverableCandidates({ isAuthenticated: false, isEmployer: false }), false);
    assert.equal(mayLoadDiscoverableCandidates({ isAuthenticated: true, isEmployer: false }), false);
    assert.equal(mayLoadDiscoverableCandidates({ isAuthenticated: false, isEmployer: true }), false);
    assert.equal(mayLoadDiscoverableCandidates({ isAuthenticated: true, isEmployer: true }), true);
  });

  it("seekers and anonymous callers receive an empty page, without table scans", async () => {
    const supabase = {
      rpc() {
        throw new Error("unauthorized callers must not hit discovery RPCs");
      },
      from() {
        throw new Error("unauthorized callers must not scan seeker tables");
      },
    };
    for (const caller of [
      { isAuthenticated: false, isEmployer: false },
      { isAuthenticated: true, isEmployer: false },
    ] as const) {
      const page = await loadDiscoverableCandidates(supabase, {
        filters: emptyCandidateFilterState(),
        page: 1,
        caller,
      });
      assert.deepEqual(page.candidates, []);
      assert.equal(page.totalCount, 0);
      assert.equal(page.currentPage, 1);
    }
  });

  it("maps only discoverable fields and drops private documents / identity", () => {
    const mapped = mapDiscoveryRpcRow(sampleRow());
    assert.ok(mapped);
    assert.equal(mapped.displayName, "Mari M.");
    assert.equal(mapped.hasBLicense, true);
    assert.equal(mapped.certificates[0]?.name, "Esmaabi");
    const keys = Object.keys(mapped);
    for (const key of DISCOVERY_FORBIDDEN_PROFILE_FIELDS) {
      assert.equal(keys.includes(key), false, `leaked ${key}`);
    }
    assert.equal("phone" in mapped, false);
    assert.equal("about" in mapped, false);
    assert.equal("full_name" in mapped, false);
    assert.equal("cv_url" in mapped, false);
    const cert = mapped.certificates[0] as Record<string, unknown>;
    for (const key of DISCOVERY_FORBIDDEN_CERTIFICATE_FIELDS) {
      assert.equal(key in cert, false, `leaked cert ${key}`);
    }
    for (const key of keys) {
      assert.ok((DISCOVERY_ALLOWED_PROFILE_FIELDS as readonly string[]).includes(key), key);
    }
    for (const key of Object.keys(cert)) {
      assert.ok((DISCOVERY_ALLOWED_CERTIFICATE_FIELDS as readonly string[]).includes(key), key);
    }
  });

  it("does not expose the full legal name in the public display name", () => {
    assert.equal(getPublicDisplayName("Mari Maasikas"), "Mari M.");
    assert.equal(getPublicDisplayName("Jaan"), "Jaan");
  });
});

describe("employer candidate discovery pagination", () => {
  it("keeps page size inside 20–30 and defaults to 24", () => {
    assert.equal(CANDIDATE_DISCOVERY_PAGE_SIZE, 24);
    assert.ok(CANDIDATE_DISCOVERY_PAGE_SIZE >= CANDIDATE_DISCOVERY_PAGE_SIZE_MIN);
    assert.ok(CANDIDATE_DISCOVERY_PAGE_SIZE <= CANDIDATE_DISCOVERY_PAGE_SIZE_MAX);
    assert.equal(clampDiscoveryPageSize(200), 30);
    assert.equal(clampDiscoveryPageSize(0), 1);
    assert.equal(clampDiscoveryPageSize(24), 24);
  });

  it("clamps the requested page against total_count", () => {
    assert.equal(discoveryPageCount(50, 24), 3);
    assert.equal(clampDiscoveryPage(9, 3), 3);
    assert.equal(clampDiscoveryPage(0, 3), 1);
    assert.equal(discoveryOffset(2, 24), 24);
  });

  it("page 2 does not include page 1 ids", () => {
    const ids = Array.from({ length: 50 }, (_, i) => `c${i}`);
    const page1 = sliceDiscoveryPage(ids, 1, 24);
    const page2 = sliceDiscoveryPage(ids, 2, 24);
    assert.equal(page1.length, 24);
    assert.equal(page2.length, 24);
    assert.equal(page1[0], "c0");
    assert.equal(page2[0], "c24");
    assert.equal(page1.some((id) => page2.includes(id)), false);
  });

  it("never forwards more than one page even if the RPC over-returns", () => {
    const candidates = Array.from({ length: 80 }, (_, i) =>
      sampleRow({ id: `p${i}`, user_id: `u${i}`, full_name: `Name ${i}` }),
    );
    const parsed = parseDiscoveryRpcPayload({
      candidates,
      total_count: 80,
      current_page: 1,
      total_pages: 4,
      page_size: 24,
    });
    assert.equal(parsed.candidates.length, 24);
    assert.equal(parsed.totalCount, 80);
    assert.equal(parsed.pageSize, 24);
    assert.equal(parsed.currentPage, 1);
    assert.equal(parsed.totalPages, 4);
  });

  it("asks Postgres for the current page only", () => {
    const args = rpcArgsFromDiscoveryFilters({
      filters: emptyCandidateFilterState(),
      page: 2,
      pageSize: 24,
    });
    assert.equal(args.p_page, 2);
    assert.equal(args.p_page_size, 24);
    assert.ok(args.p_page_size <= CANDIDATE_DISCOVERY_PAGE_SIZE_MAX);
    assert.ok(args.p_page_size >= 20);
  });
});

describe("employer candidate discovery loader", () => {
  it("loads via RPC instead of selecting hundreds of seeker rows", async () => {
    const calls: string[] = [];
    const supabase = {
      rpc(name: string, args?: Record<string, unknown>) {
        calls.push(name);
        if (name === "search_discoverable_candidates") {
          assert.equal(args?.p_page_size, 24);
          return Promise.resolve({
            data: {
              candidates: [sampleRow()],
              total_count: 1,
              current_page: 1,
              total_pages: 1,
              page_size: 24,
            },
            error: null,
          });
        }
        if (name === "discoverable_candidate_facets") {
          return Promise.resolve({
            data: { locations: ["Tallinn"], skills: ["Hooldus"], certificates: [], availability: [], languages: [] },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: { message: `unexpected ${name}` } });
      },
      from() {
        throw new Error("discovery must not scan seeker_profiles / seeker_certificates from the page");
      },
    };
    const page = await loadDiscoverableCandidates(supabase, {
      filters: emptyCandidateFilterState(),
      page: 1,
      caller: { isAuthenticated: true, isEmployer: true },
    });
    assert.deepEqual(calls, ["search_discoverable_candidates", "discoverable_candidate_facets"]);
    assert.equal(page.candidates.length, 1);
    assert.equal(page.totalCount, 1);
    assert.equal(page.candidates[0]?.displayName, "Mari M.");
    assert.equal("phone" in (page.candidates[0] ?? {}), false);
  });

  it("fails closed when the RPC is missing instead of loading a large client pool", async () => {
    const supabase = {
      rpc() {
        return Promise.resolve({
          data: null,
          error: { message: "Could not find the function public.search_discoverable_candidates in the schema cache" },
        });
      },
      from() {
        throw new Error("must not fall back to scanning tables");
      },
    };
    const page = await loadDiscoverableCandidates(supabase, {
      filters: emptyCandidateFilterState(),
      page: 1,
      caller: { isAuthenticated: true, isEmployer: true },
    });
    assert.equal(page.schemaMissing, true);
    assert.deepEqual(page.candidates, []);
    assert.equal(page.totalCount, 0);
  });
});

describe("employer candidate discovery URL state", () => {
  it("round-trips filters and omits page 1", () => {
    const filters = {
      ...emptyCandidateFilterState(),
      query: "õde",
      remote: true,
      locations: ["Tallinn"],
      skills: ["Hooldus"],
    };
    const url = buildCandidateDiscoveryUrl({ filters, page: 1 });
    assert.match(url, /q=%C3%B5de/);
    assert.match(url, /remote=1/);
    assert.doesNotMatch(url, /page=/);
    const parsed = parseCandidateDiscoveryParams(new URLSearchParams(url.split("?")[1] ?? ""));
    assert.equal(parsed.filters.query, "õde");
    assert.equal(parsed.filters.remote, true);
    assert.deepEqual(parsed.filters.locations, ["Tallinn"]);
    assert.equal(parsed.page, 1);
  });

  it("keeps page 2+ in the query string", () => {
    const url = buildCandidateDiscoveryUrl({ filters: emptyCandidateFilterState(), page: 2 });
    assert.equal(url, "/account/employer/candidates?page=2");
    assert.equal(parseCandidateDiscoveryParams({ page: "2" }).page, 2);
  });
});

describe("discovery filter spec still matches practical-fit rules", () => {
  it("rejects hidden private fields as a reason to match — matching uses discoverable DTO only", () => {
    const candidate = mapDiscoveryRpcRow(sampleRow())!;
    assert.equal(
      candidateMatchesFilters(candidate, { ...emptyCandidateFilterState(), remote: true }),
      false,
    );
    assert.equal(
      candidateMatchesFilters(candidate, { ...emptyCandidateFilterState(), onSite: true }),
      true,
    );
    assert.equal(
      candidateMatchesFilters(candidate, { ...emptyCandidateFilterState(), query: "esmaabi" }),
      true,
    );
  });
});
