#!/usr/bin/env node
/**
 * Static verification that the full migration sequence can apply from scratch.
 * Tracks table/column/function/trigger/view creation order and checks references.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "../supabase/migrations");
const files = readdirSync(dir).filter(f => f.endsWith(".sql")).sort();

const tables = new Set();
const functions = new Set();
const views = new Set();
const errors = [];
const warnings = [];

// Pre-existing Supabase tables/schemas
tables.add("auth.users");
tables.add("storage.objects");
tables.add("storage.buckets");

for (const f of files) {
  const sql = readFileSync(join(dir, f), "utf8");

  // Track CREATE TABLE
  for (const m of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-z0-9_]+)/gi)) {
    tables.add(m[1].toLowerCase());
  }

  // Track CREATE VIEW
  for (const m of sql.matchAll(/create\s+(?:or\s+replace\s+)?view\s+(?:public\.)?([a-z0-9_]+)/gi)) {
    views.add(m[1].toLowerCase());
  }

  // Track CREATE FUNCTION
  for (const m of sql.matchAll(/create\s+or\s+replace\s+function\s+(?:public\.|private\.)?([a-z0-9_]+)/gi)) {
    functions.add(m[1].toLowerCase());
  }

  // Check ALTER TABLE references
  for (const m of sql.matchAll(/alter\s+table\s+(?:if\s+exists\s+)?(?:public\.)?([a-z0-9_]+)/gi)) {
    const t = m[1].toLowerCase();
    if (!tables.has(t) && !sql.includes("IF NOT EXISTS") && !sql.includes("to_regclass")) {
      // Check if there's an IF EXISTS guard
      const ctx = sql.slice(Math.max(0, m.index - 50), m.index + m[0].length + 20);
      if (!/if\s+exists/i.test(ctx) && !/to_regclass/i.test(sql)) {
        warnings.push(`${f}: ALTER TABLE on '${t}' — table may not exist yet`);
      }
    }
  }

  // Check ENABLE ROW LEVEL SECURITY
  for (const m of sql.matchAll(/alter\s+table\s+(?:public\.)?([a-z0-9_]+)\s+enable\s+row\s+level\s+security/gi)) {
    const t = m[1].toLowerCase();
    if (!tables.has(t)) {
      const isGuarded = sql.includes(`to_regclass('public.${t}')`) || sql.includes(`to_regclass('${t}')`);
      if (!isGuarded) {
        errors.push(`${f}: ENABLE RLS on '${t}' which doesn't exist yet and isn't guarded`);
      }
    }
  }

  // Check CREATE TRIGGER references
  for (const m of sql.matchAll(/create\s+trigger\s+([a-z0-9_]+)\s+.*?\s+on\s+(?:public\.)?([a-z0-9_]+)/gis)) {
    const trig = m[1].toLowerCase();
    const t = m[2].toLowerCase();
    if (!tables.has(t) && t !== "objects") {
      warnings.push(`${f}: trigger '${trig}' on '${t}' — table may not exist`);
    }
  }

  // Check FK references
  for (const m of sql.matchAll(/references\s+(?:public\.)?([a-z0-9_]+)/gi)) {
    const t = m[1].toLowerCase();
    if (!tables.has(t) && t !== "users" && t !== "objects" && t !== "buckets") {
      warnings.push(`${f}: FK references '${t}' — may not exist yet`);
    }
  }

  // Check policy on table
  for (const m of sql.matchAll(/create\s+policy\s+"[^"]+"\s+on\s+(?:public\.)?([a-z0-9_]+)/gi)) {
    const t = m[1].toLowerCase();
    if (!tables.has(t) && t !== "objects") {
      const isGuarded = sql.includes(`to_regclass('public.${t}')`) || sql.includes(`to_regclass('${t}')`);
      if (!isGuarded) {
        errors.push(`${f}: policy on '${t}' which may not exist`);
      }
    }
  }
}

console.log(`Verified ${files.length} migrations in filename order.`);
console.log(`Tables: ${tables.size}, Views: ${views.size}, Functions: ${functions.size}`);
console.log();

if (errors.length) {
  console.error(`ERRORS (${errors.length}):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
}
if (warnings.length) {
  console.warn(`WARNINGS (${warnings.length}):`);
  for (const w of warnings) console.warn(`  ⚠ ${w}`);
}
if (!errors.length) {
  console.log("PASS: No critical ordering errors found.");
}

process.exit(errors.length ? 1 : 0);
