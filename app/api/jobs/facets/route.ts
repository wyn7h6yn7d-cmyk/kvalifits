import { NextResponse } from "next/server";

import { isSearchableFacet, type JobFilterFacet } from "@/lib/jobs/jobSearchFacets";
import { searchPublishedFacetValues } from "@/lib/jobs/searchPublishedFacetValues";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const facet = (url.searchParams.get("facet") ?? "").trim() as JobFilterFacet;
  const q = (url.searchParams.get("q") ?? "").trim();

  if (!isSearchableFacet(facet)) {
    return NextResponse.json({ error: "invalid_facet" }, { status: 400 });
  }
  if (q.length < 2) {
    return NextResponse.json({ options: [] });
  }

  const options = await searchPublishedFacetValues(facet, q, url.searchParams);
  return NextResponse.json({ options });
}
