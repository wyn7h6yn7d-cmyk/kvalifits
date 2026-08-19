import type { SupabaseClient } from "@supabase/supabase-js";

import {
  CANDIDATE_DISCOVERY_PAGE_SIZE,
  emptyDiscoveryRpcPayload,
  isDiscoveryRpcMissing,
  mayLoadDiscoverableCandidates,
  parseDiscoveryRpcPayload,
  rpcArgsFromDiscoveryFilters,
  type DiscoveryRpcPayload,
} from "@/lib/employer/candidateDiscovery";
import {
  COMMON_LANGUAGE_CHIPS,
  emptyCandidateFacetOptions,
  type CandidateFacetOptions,
  type CandidateFilterState,
} from "@/lib/employer/candidateFilters";

export type DiscoverableCandidatesPage = DiscoveryRpcPayload & {
  facets: CandidateFacetOptions;
  schemaMissing: boolean;
  errorMessage: string | null;
};

function emptyPage(schemaMissing = false, errorMessage: string | null = null): DiscoverableCandidatesPage {
  return {
    ...emptyDiscoveryRpcPayload(CANDIDATE_DISCOVERY_PAGE_SIZE),
    facets: emptyCandidateFacetOptions(),
    schemaMissing,
    errorMessage,
  };
}

function asFacetList(raw: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(raw)) return [...fallback];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const value =
      typeof item === "string"
        ? item.trim()
        : item && typeof item === "object" && "value" in item
          ? String((item as { value?: unknown }).value ?? "").trim()
          : "";
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  for (const extra of fallback) {
    if (!seen.has(extra)) {
      seen.add(extra);
      out.push(extra);
    }
  }
  return out;
}

function parseFacetsPayload(raw: unknown): CandidateFacetOptions {
  const empty = emptyCandidateFacetOptions();
  if (!raw || typeof raw !== "object") return empty;
  const o = raw as Record<string, unknown>;
  return {
    locations: asFacetList(o.locations),
    skills: asFacetList(o.skills),
    certificates: asFacetList(o.certificates),
    availability: asFacetList(o.availability),
    languages: asFacetList(o.languages, [...COMMON_LANGUAGE_CHIPS]),
  };
}

function mergeSelectedFacets(
  facets: CandidateFacetOptions,
  filters: CandidateFilterState,
): CandidateFacetOptions {
  const merge = (list: string[], selected: string[]) => {
    const seen = new Set(list);
    const out = [...list];
    for (const v of selected) {
      const t = v.trim();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      out.push(t);
    }
    return out;
  };
  return {
    locations: merge(facets.locations, filters.locations),
    skills: merge(facets.skills, filters.skills),
    certificates: merge(facets.certificates, filters.certificates),
    availability: merge(facets.availability, filters.availability),
    languages: merge(facets.languages, filters.languages),
  };
}

export async function loadDiscoverableCandidates(
  supabase: Pick<SupabaseClient, "rpc">,
  params: {
    filters: CandidateFilterState;
    page: number;
    caller: { isAuthenticated: boolean; isEmployer: boolean };
  },
): Promise<DiscoverableCandidatesPage> {
  if (!mayLoadDiscoverableCandidates(params.caller)) {
    return emptyPage();
  }

  const args = rpcArgsFromDiscoveryFilters({
    filters: params.filters,
    page: params.page,
    pageSize: CANDIDATE_DISCOVERY_PAGE_SIZE,
  });

  const [searchRes, facetRes] = await Promise.all([
    supabase.rpc("search_discoverable_candidates", args),
    supabase.rpc("discoverable_candidate_facets"),
  ]);

  if (searchRes.error) {
    return emptyPage(isDiscoveryRpcMissing(searchRes.error.message), searchRes.error.message ?? null);
  }

  const parsed = parseDiscoveryRpcPayload(searchRes.data);
  const facets = mergeSelectedFacets(parseFacetsPayload(facetRes.data), params.filters);
  return {
    ...parsed,
    facets,
    schemaMissing: false,
    errorMessage: null,
  };
}
