/**
 * One-time copy of public avatar-bucket CV PDFs into private `resumes`.
 *
 * Does not delete source objects until the copy is verified and DB refs are updated.
 *
 * Dry run (default):
 *   node --env-file=.env.local scripts/migrate-public-cvs-to-resumes.mjs
 *
 * Apply:
 *   node --env-file=.env.local scripts/migrate-public-cvs-to-resumes.mjs --apply
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(path) {
  try {
    const text = readFileSync(path, "utf8");
    for (const line of text.split("\n")) {
      const s = line.trim();
      if (!s || s.startsWith("#") || !s.includes("=")) continue;
      const i = s.indexOf("=");
      const k = s.slice(0, i).trim();
      let v = s.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!(k in process.env)) process.env[k] = v;
    }
  } catch {
    // optional
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));

const apply = process.argv.includes("--apply");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/$/, "");
if (!serviceKey || !url) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PUBLIC_CV =
  /\/storage\/v1\/object\/public\/avatars\/([0-9a-f-]+\/cv\/[^?]+)/i;

function pathFromCvUrl(value) {
  const raw = (value ?? "").toString().trim();
  if (!raw) return null;
  if (!raw.startsWith("http")) {
    if (raw.includes("/cv/") && UUID_RE.test(raw.split("/")[0] ?? "")) return raw.split("?")[0];
    return null;
  }
  const m = raw.match(PUBLIC_CV);
  return m?.[1] ? decodeURIComponent(m[1].split("?")[0]) : null;
}

const paths = new Map();

function remember(path, source) {
  if (!path || path.includes("..")) return;
  const owner = path.split("/")[0] ?? "";
  if (!UUID_RE.test(owner) || !path.includes("/cv/")) return;
  const prev = paths.get(path);
  paths.set(path, { path, sources: [...new Set([...(prev?.sources ?? []), source])] });
}

const { data: profiles, error: profileErr } = await admin
  .from("seeker_profiles")
  .select("user_id,cv_url")
  .not("cv_url", "is", null);

if (profileErr) {
  console.error("seeker_profiles:", profileErr.message);
  process.exit(1);
}

for (const row of profiles ?? []) {
  const path = pathFromCvUrl(row.cv_url);
  if (path) remember(path, `seeker_profiles:${row.user_id}`);
}

const { data: apps, error: appErr } = await admin
  .from("job_applications")
  .select("id,shared_profile")
  .not("shared_profile", "is", null)
  .limit(5000);

if (appErr) {
  console.error("job_applications:", appErr.message);
  process.exit(1);
}

for (const row of apps ?? []) {
  const cv = row.shared_profile?.seeker?.cv_url;
  const path = pathFromCvUrl(cv);
  if (path) remember(path, `job_applications:${row.id}`);
}

console.log(`Found ${paths.size} CV object path(s). mode=${apply ? "APPLY" : "dry-run"}`);

let copied = 0;
let skipped = 0;
let failed = 0;

for (const { path, sources } of paths.values()) {
  const { data: existing } = await admin.storage.from("resumes").download(path);
  if (existing) {
    console.log(`SKIP already in resumes: ${path}`);
    skipped += 1;
    if (apply) {
      await rewriteDb(path);
    }
    continue;
  }

  const { data: src, error: dlErr } = await admin.storage.from("avatars").download(path);
  if (dlErr || !src) {
    console.warn(`MISS avatars: ${path} (${dlErr?.message || "empty"}) [${sources.join(", ")}]`);
    failed += 1;
    continue;
  }
  const bytes = Buffer.from(await src.arrayBuffer());
  console.log(`${apply ? "COPY" : "WOULD COPY"} ${path} (${bytes.length} bytes)`);
  if (!apply) continue;

  const { error: upErr } = await admin.storage.from("resumes").upload(path, bytes, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (upErr) {
    console.warn(`UPLOAD FAIL ${path}: ${upErr.message}`);
    failed += 1;
    continue;
  }
  const { data: verify, error: vErr } = await admin.storage.from("resumes").download(path);
  if (vErr || !verify) {
    console.warn(`VERIFY FAIL ${path}: ${vErr?.message || "empty"} — not deleting source`);
    failed += 1;
    continue;
  }
  const verifyBytes = Buffer.from(await verify.arrayBuffer());
  if (verifyBytes.length !== bytes.length) {
    console.warn(`VERIFY SIZE MISMATCH ${path}: ${verifyBytes.length} != ${bytes.length} — not deleting source`);
    failed += 1;
    continue;
  }

  await rewriteDb(path);
  const { error: rmErr } = await admin.storage.from("avatars").remove([path]);
  if (rmErr) {
    console.warn(`SOURCE DELETE FAIL ${path}: ${rmErr.message}`);
    failed += 1;
    continue;
  }
  copied += 1;
}

async function rewriteDb(path) {
  const owner = path.split("/")[0];
  if (!owner) return;
  await admin.from("seeker_profiles").update({ cv_url: path }).eq("user_id", owner);

  const { data: hitApps } = await admin
    .from("job_applications")
    .select("id,shared_profile")
    .eq("seeker_user_id", owner)
    .not("shared_profile", "is", null)
    .limit(5000);
  for (const row of hitApps ?? []) {
    const current = row.shared_profile?.seeker?.cv_url;
    if (!current) continue;
    const asPath = pathFromCvUrl(current);
    if (asPath !== path && current !== path) continue;
    const next = {
      ...row.shared_profile,
      seeker: { ...row.shared_profile.seeker, cv_url: path },
    };
    await admin.from("job_applications").update({ shared_profile: next }).eq("id", row.id);
  }
}

console.log(`Done. copied=${copied} already_private=${skipped} failed=${failed}`);
if (!apply) {
  console.log("Re-run with --apply to copy, rewrite DB refs, then delete public objects.");
}
process.exit(failed ? 1 : 0);
