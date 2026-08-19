#!/usr/bin/env node
/**
 * Read-only remote Supabase database audit.
 * Uses service_role key via PostgREST RPC to inspect schema state.
 */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://svqdycsticovpudcgqvq.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) {
  console.error("SUPABASE_SERVICE_ROLE_KEY required");
  process.exit(1);
}

async function postGrestGet(path, params = {}) {
  const u = new URL(`${url}/rest/v1/${path}`);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const res = await fetch(u.toString(), {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    return { error: `${res.status}: ${text.slice(0, 200)}` };
  }
  return res.json();
}

const results = {};

// 1. Check migration history
console.log("1. Checking supabase_migrations.schema_migrations...");
try {
  const res = await fetch(
    `${url}/rest/v1/schema_migrations?select=version,name&order=version`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
        "Accept-Profile": "supabase_migrations",
      },
    }
  );
  if (res.ok) {
    results.migrations = await res.json();
    console.log(`  Found ${results.migrations.length} applied migrations`);
  } else {
    console.log(`  Migration table not accessible: ${res.status}`);
    results.migrations = [];
  }
} catch (e) {
  console.log(`  Error: ${e.message}`);
  results.migrations = [];
}

// 2. List all public tables
console.log("2. Listing public tables...");
try {
  const res = await fetch(`${url}/rest/v1/`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
  });
  if (res.ok) {
    const body = await res.json();
    // PostgREST root returns OpenAPI spec with paths
    if (body.paths) {
      results.tables = Object.keys(body.paths)
        .map((p) => p.replace(/^\//, ""))
        .filter((t) => !t.startsWith("rpc/") && t)
        .sort();
    } else if (body.definitions) {
      results.tables = Object.keys(body.definitions).sort();
    } else {
      results.tables = Object.keys(body).sort();
    }
    console.log(`  Found ${results.tables.length} tables/views`);
  }
} catch (e) {
  console.log(`  Error: ${e.message}`);
}

// 3. Check specific tables exist and get row counts
const criticalTables = [
  "profiles",
  "seeker_profiles",
  "employer_profiles",
  "seeker_certificates",
  "job_posts",
  "job_applications",
  "job_application_internal_notes",
  "job_application_status_events",
  "job_post_reports",
  "saved_jobs",
  "saved_job_searches",
  "admin_audit_log",
  "auth_rate_limit_buckets",
  "account_deletion_events",
  "legal_retention_records",
  "seeker_workplace_needs",
  "seeker_work_capacity",
  "seeker_certificates_verification_stash",
  "taxonomy_industries",
  "taxonomy_professions",
  "taxonomy_skills",
  "taxonomy_profession_skills",
  "taxonomy_certificates",
  "taxonomy_languages",
  "taxonomy_aliases",
  "notifications",
  "saved_search_alert_deliveries",
  "seeker_education",
];

console.log("3. Checking critical tables...");
results.tableStatus = {};
for (const t of criticalTables) {
  try {
    const res = await fetch(
      `${url}/rest/v1/${t}?select=count&limit=0`,
      {
        method: "HEAD",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Prefer: "count=exact",
        },
      }
    );
    const count = res.headers.get("content-range");
    results.tableStatus[t] = {
      exists: res.ok,
      status: res.status,
      count: count || "unknown",
    };
  } catch {
    results.tableStatus[t] = { exists: false, status: "error" };
  }
}
for (const [t, s] of Object.entries(results.tableStatus)) {
  console.log(`  ${t}: ${s.exists ? "✓" : "✗"} (${s.count || s.status})`);
}

// 4. Check storage buckets
console.log("4. Checking storage buckets...");
try {
  const res = await fetch(`${url}/storage/v1/bucket`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
  });
  if (res.ok) {
    results.buckets = await res.json();
    for (const b of results.buckets) {
      console.log(
        `  ${b.id}: public=${b.public}, mime=${JSON.stringify(b.allowed_mime_types)}, size_limit=${b.file_size_limit}`
      );
    }
  }
} catch (e) {
  console.log(`  Error: ${e.message}`);
}

// 5. Check taxonomy seed data
console.log("5. Checking taxonomy seed data...");
for (const t of [
  "taxonomy_industries",
  "taxonomy_professions",
  "taxonomy_skills",
  "taxonomy_certificates",
  "taxonomy_languages",
]) {
  try {
    const data = await postGrestGet(t, { select: "id,name_et", order: "id" });
    if (Array.isArray(data)) {
      results[`seed_${t}`] = data;
      console.log(`  ${t}: ${data.length} rows`);
    } else {
      console.log(`  ${t}: ${JSON.stringify(data).slice(0, 100)}`);
    }
  } catch (e) {
    console.log(`  ${t}: error - ${e.message}`);
  }
}

// 6. Check RPC functions exist
console.log("6. Checking RPC functions...");
const rpcs = [
  "search_published_jobs",
  "published_job_search_facets",
  "published_job_facet_values",
  "get_job_match_inputs",
];
results.rpcs = {};
for (const fn of rpcs) {
  try {
    const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    results.rpcs[fn] = {
      accessible: res.status !== 404,
      status: res.status,
    };
    console.log(`  ${fn}: ${res.status !== 404 ? "✓ exists" : "✗ missing"} (${res.status})`);
  } catch (e) {
    results.rpcs[fn] = { accessible: false, error: e.message };
    console.log(`  ${fn}: error`);
  }
}

// 7. Check employer_profiles columns
console.log("7. Checking employer_profiles columns...");
try {
  const res = await fetch(
    `${url}/rest/v1/employer_profiles?select=*&limit=0`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/vnd.pgrst.object+json",
        Prefer: "count=exact",
      },
    }
  );
  if (res.ok || res.status === 406) {
    const openapi = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (openapi.ok) {
      const spec = await openapi.json();
      const def =
        spec.definitions?.employer_profiles?.properties ||
        spec.components?.schemas?.employer_profiles?.properties;
      if (def) {
        results.employer_columns = Object.keys(def).sort();
        console.log(`  Columns: ${results.employer_columns.join(", ")}`);
      } else {
        console.log("  Could not parse employer_profiles schema from OpenAPI");
      }
    }
  }
} catch (e) {
  console.log(`  Error: ${e.message}`);
}

// 8. Check employer_profiles uniqueness
console.log("8. Checking employer_profiles owner_user_id uniqueness...");
try {
  const data = await postGrestGet("employer_profiles", {
    select: "owner_user_id",
  });
  if (Array.isArray(data)) {
    const owners = data.map((r) => r.owner_user_id).filter(Boolean);
    const dupes = owners.filter((v, i, a) => a.indexOf(v) !== i);
    results.employer_owner_uniqueness = {
      total: data.length,
      with_owner: owners.length,
      duplicates: [...new Set(dupes)],
    };
    console.log(
      `  ${data.length} profiles, ${owners.length} with owner, ${dupes.length} duplicates`
    );
  }
} catch (e) {
  console.log(`  Error: ${e.message}`);
}

// 9. Check job_type enum values
console.log("9. Checking job_type enum...");
try {
  const data = await postGrestGet("job_posts", {
    select: "job_type",
    limit: "1000",
  });
  if (Array.isArray(data)) {
    const types = [...new Set(data.map((r) => r.job_type).filter(Boolean))];
    results.job_types = types.sort();
    console.log(`  Used values: ${types.join(", ") || "(none)"}`);
  }
} catch (e) {
  console.log(`  Error: ${e.message}`);
}

// 10. Check views
console.log("10. Checking views...");
for (const v of ["employer_public_profiles"]) {
  try {
    const res = await fetch(`${url}/rest/v1/${v}?limit=0`, {
      method: "HEAD",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: "count=exact",
      },
    });
    console.log(`  ${v}: ${res.ok ? "✓" : "✗"} (${res.status})`);
    results[`view_${v}`] = { exists: res.ok, status: res.status };
  } catch {
    console.log(`  ${v}: error`);
  }
}

// Write results
const outPath = join(__dirname, "..", "docs", "remote-db-audit-results.json");
writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(`\nResults written to ${outPath}`);
