#!/usr/bin/env node
/**
 * Static check that repository migrations can be applied in filename order
 * without the known P0 failures (job_post_reports missing, consent overwrite).
 * Does not connect to a database.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "../supabase/migrations");
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort((a, b) => a.localeCompare(b));

const failures = [];
const created = new Set();
const tableCreate = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-z0-9_]+)/gi;

function tablesFrom(sql) {
  const out = [];
  let m;
  const re = new RegExp(tableCreate.source, "gi");
  while ((m = re.exec(sql))) out.push(m[1]);
  return out;
}

let sawConsentLock = false;
let dateOfBirthOverwroteConsent = false;

for (const f of files) {
  const sql = readFileSync(join(dir, f), "utf8");
  for (const t of tablesFrom(sql)) created.add(t);

  if (
    f.includes("admin_rls_consistency") &&
    /alter table public\.job_post_reports enable row level security/i.test(sql) &&
    !/to_regclass\('public\.job_post_reports'\)/i.test(sql)
  ) {
    failures.push(`${f}: enables RLS on job_post_reports without existence guard`);
  }

  if (sql.includes("legal_representative_consent_status = 'confirmed'")) {
    sawConsentLock = true;
  }

  if (f.includes("seeker_date_of_birth_minor")) {
    if (!sql.includes("legal_representative_consent_status = 'confirmed'")) {
      dateOfBirthOverwroteConsent = true;
      failures.push(`${f}: age function is missing consent self-confirm lock`);
    }
  }

  if (f.includes("archive_expired_job_posts") && /create extension if not exists pg_cron/i.test(sql)) {
    if (!/exception/i.test(sql)) {
      failures.push(`${f}: pg_cron CREATE EXTENSION is not exception-guarded`);
    }
  }
}

if (dateOfBirthOverwroteConsent && sawConsentLock) {
  failures.push("consent lock exists in an earlier file but date_of_birth overwrote it");
}

const recon = files.filter((f) => f.includes("reconciliation"));
if (recon.length < 3) {
  failures.push(`expected 3 reconciliation migrations, found ${recon.join(", ") || "none"}`);
}

console.log(`Checked ${files.length} migrations in filename order.`);
console.log(`CREATE TABLE seen for: ${[...created].sort().join(", ")}`);
if (failures.length) {
  console.error("FAIL");
  for (const x of failures) console.error(" -", x);
  process.exit(1);
}
console.log("PASS: known fresh-apply traps are guarded.");
console.log("Consent lock is present in seeker_date_of_birth_minor.");
console.log(`Reconciliation files: ${recon.join(", ")}`);
