/**
 * Live Supabase RLS security suite.
 * Seeds ephemeral seeker A/B + employer A, runs negative/positive checks, cleans up.
 *
 * Usage:
 *   node --env-file=/Users/kennethalto/kvalifits/.env.local scripts/rls-security-suite.mjs
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY. Project URL derived from JWT `ref` if
 * NEXT_PUBLIC_SUPABASE_URL is unset.
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
loadEnvFile("/Users/kennethalto/kvalifits/.env.local");

function decodeJwtPayload(jwt) {
  const part = jwt.split(".")[1];
  const pad = "=".repeat((4 - (part.length % 4)) % 4);
  return JSON.parse(Buffer.from(part + pad, "base64url").toString("utf8"));
}

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const ref = decodeJwtPayload(serviceKey).ref;
const url =
  (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/$/, "") ||
  `https://${ref}.supabase.co`;
const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim() || serviceKey;

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const stamp = Date.now().toString(36);
const password = `RlsTest-${stamp}-Aa1!`;

function clientForToken(accessToken) {
  // Prefer anon for apikey when available; fall back to service key with user Bearer.
  // PostgREST RLS follows Authorization JWT role (authenticated), not service_role.
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

const anon = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const results = [];

function record(name, pass, detail = "") {
  results.push({ name, pass, detail });
  const mark = pass ? "PASS" : "FAIL";
  console.log(`${mark}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function expectDenied(name, fn) {
  try {
    const { data, error } = await fn();
    const empty = data == null || (Array.isArray(data) && data.length === 0);
    if (error) {
      record(name, true, error.code || error.message);
      return;
    }
    if (empty) {
      record(name, true, "empty (RLS filtered)");
      return;
    }
    record(name, false, `unexpected data: ${JSON.stringify(data).slice(0, 180)}`);
  } catch (e) {
    record(name, true, e?.message || String(e));
  }
}

async function expectOk(name, fn) {
  try {
    const { data, error } = await fn();
    if (error) {
      record(name, false, error.message);
      return data;
    }
    record(name, true);
    return data;
  } catch (e) {
    record(name, false, e?.message || String(e));
    return null;
  }
}

async function createUser(email, role) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role },
  });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);
  return data.user;
}

async function signIn(email) {
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error) {
    // Fallback: password grant via service apikey
    const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(`signIn ${email}: ${error.message} / ${body.msg || JSON.stringify(body)}`);
    return body.access_token;
  }
  return data.session.access_token;
}

async function cleanupUser(userId) {
  if (!userId) return;
  await admin.from("job_applications").delete().eq("seeker_user_id", userId);
  await admin.from("seeker_certificates").delete().eq("user_id", userId);
  await admin.from("seeker_work_capacity").delete().eq("user_id", userId);
  await admin.from("seeker_workplace_needs").delete().eq("user_id", userId);
  await admin.from("seeker_profiles").delete().eq("user_id", userId);
  const { data: eps } = await admin.from("employer_profiles").select("id").eq("owner_user_id", userId);
  for (const ep of eps ?? []) {
    await admin.from("job_posts").delete().eq("employer_profile_id", ep.id);
  }
  await admin.from("employer_profiles").delete().eq("owner_user_id", userId);
  await admin.from("profiles").delete().eq("id", userId);
  await admin.auth.admin.deleteUser(userId);
}

const ids = { seekerA: null, seekerB: null, employerA: null, employerB: null };

try {
  console.log(`RLS suite → ${url}`);

  const emailA = `rls-seeker-a-${stamp}@example.com`;
  const emailB = `rls-seeker-b-${stamp}@example.com`;
  const emailE = `rls-employer-a-${stamp}@example.com`;
  const emailE2 = `rls-employer-b-${stamp}@example.com`;

  const uA = await createUser(emailA, "seeker");
  const uB = await createUser(emailB, "seeker");
  const uE = await createUser(emailE, "employer");
  const uE2 = await createUser(emailE2, "employer");
  ids.seekerA = uA.id;
  ids.seekerB = uB.id;
  ids.employerA = uE.id;
  ids.employerB = uE2.id;

  // Seed profiles (triggers / registration may already insert — upsert)
  for (const [id, role, email] of [
    [uA.id, "seeker", emailA],
    [uB.id, "seeker", emailB],
    [uE.id, "employer", emailE],
    [uE2.id, "employer", emailE2],
  ]) {
    await admin.from("profiles").upsert({ id, email, role, is_blocked: false });
  }

  await admin.from("seeker_profiles").upsert({
    user_id: uA.id,
    full_name: "Seeker A",
    profile_title: "A",
    phone: "+37250000001",
    location: "Tallinn",
    about: "private about A",
    profile_visible: false,
    is_complete: true,
    completion_percent: 100,
  });
  await admin.from("seeker_profiles").upsert({
    user_id: uB.id,
    full_name: "Seeker B Secret",
    profile_title: "B private",
    phone: "+37250000002",
    location: "Tartu",
    about: "SHOULD_NOT_LEAK",
    profile_visible: false,
    is_complete: true,
    completion_percent: 100,
  });

  await admin.from("seeker_work_capacity").upsert({
    user_id: uB.id,
    status: "partial",
  });

  const { data: certB, error: certErr } = await admin
    .from("seeker_certificates")
    .insert({
      user_id: uB.id,
      certificate_name: "Secret Cert B",
      certificate_issuer: "Test Issuer",
      certificate_valid_from: "2025-01-01",
      certificate_valid_until: "2027-01-01",
      certificate_image_url: `${uB.id}/certificates/secret-b.pdf`,
      verification_status: "verified",
      verified_at: "2026-01-01",
      verification_source: "manual",
      verified_by: "admin",
    })
    .select("id")
    .single();
  if (certErr) throw new Error(`cert seed: ${certErr.message}`);

  const { data: certA, error: certAErr } = await admin
    .from("seeker_certificates")
    .insert({
      user_id: uA.id,
      certificate_name: "Cert A",
      certificate_issuer: "Issuer A",
      certificate_valid_from: "2025-01-01",
      certificate_valid_until: "2027-01-01",
      certificate_image_url: `${uA.id}/certificates/cert-a.pdf`,
      verification_status: "verified",
      verified_at: "2026-01-02",
      verification_source: "manual",
      verified_by: "admin",
    })
    .select("id,verification_status")
    .single();
  if (certAErr) throw new Error(`certA seed: ${certAErr.message}`);

  const { data: epA, error: epAErr } = await admin
    .from("employer_profiles")
    .upsert(
      {
        owner_user_id: uE.id,
        company_name: "Employer A Co",
        contact_email: emailE,
        company_description: "Employer A desc",
        location: "Tallinn",
      },
      { onConflict: "owner_user_id" }
    )
    .select("id")
    .single();
  if (epAErr) throw new Error(`epA: ${epAErr.message}`);

  const { data: epB, error: epBErr } = await admin
    .from("employer_profiles")
    .upsert(
      {
        owner_user_id: uE2.id,
        company_name: "Employer B Co SECRET",
        contact_email: emailE2,
        company_description: "other company",
        location: "Pärnu",
      },
      { onConflict: "owner_user_id" }
    )
    .select("id")
    .single();
  if (epBErr) throw new Error(`epB: ${epBErr.message}`);

  const { data: jobADraft, error: jobAErr } = await admin
    .from("job_posts")
    .insert({
      employer_profile_id: epA.id,
      created_by: uE.id,
      title: "Employer A Draft",
      slug: `rls-a-draft-${stamp}`,
      location: "Tallinn",
      work_type: "full_time",
      job_type: "permanent",
      short_summary: "draft A",
      description: "draft A body",
      status: "draft",
      application_type: "in_app",
    })
    .select("id")
    .single();
  if (jobAErr) throw new Error(`jobA draft: ${jobAErr.message}`);

  const { data: jobAPub, error: jobAPubErr } = await admin
    .from("job_posts")
    .insert({
      employer_profile_id: epA.id,
      created_by: uE.id,
      title: "Employer A Published",
      slug: `rls-a-pub-${stamp}`,
      location: "Tallinn",
      work_type: "full_time",
      job_type: "permanent",
      short_summary: "pub A",
      description: "pub A body",
      status: "published",
      application_type: "in_app",
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (jobAPubErr) throw new Error(`jobA pub: ${jobAPubErr.message}`);

  const { data: jobB, error: jobBErr } = await admin
    .from("job_posts")
    .insert({
      employer_profile_id: epB.id,
      created_by: uE2.id,
      title: "Employer B Job SECRET",
      slug: `rls-b-job-${stamp}`,
      location: "Pärnu",
      work_type: "full_time",
      job_type: "permanent",
      short_summary: "other employer job",
      description: "should not be writable by A",
      status: "draft",
      application_type: "in_app",
    })
    .select("id")
    .single();
  if (jobBErr) throw new Error(`jobB: ${jobBErr.message}`);

  const { data: appB, error: appErr } = await admin
    .from("job_applications")
    .insert({
      job_post_id: jobB.id,
      seeker_user_id: uB.id,
      cover_letter: "app to B",
      consent_to_share: false,
      shared_profile: { secret: true },
      match_score: 88,
      match_breakdown: { v: 1 },
      status: "new",
      application_answers: { noteForEmployer: "hi" },
    })
    .select("id,match_score")
    .single();
  if (appErr) throw new Error(`appB: ${appErr.message}`);

  const { data: appA, error: appAErr } = await admin
    .from("job_applications")
    .insert({
      job_post_id: jobAPub.id,
      seeker_user_id: uA.id,
      cover_letter: "app A",
      consent_to_share: true,
      shared_profile: { ok: true },
      match_score: 77,
      match_breakdown: { v: 1 },
      status: "new",
      application_answers: { salary_expectation_min: 1000 },
    })
    .select("id,match_score")
    .single();
  if (appAErr) throw new Error(`appA: ${appAErr.message}`);

  const tokenA = await signIn(emailA);
  const tokenB = await signIn(emailB);
  const tokenE = await signIn(emailE);
  const seekerA = clientForToken(tokenA);
  const seekerB = clientForToken(tokenB);
  const employerA = clientForToken(tokenE);

  console.log("\n--- Negative: Seeker A ---");
  await expectDenied("Seeker A cannot SELECT Seeker B private seeker_profiles", async () =>
    seekerA.from("seeker_profiles").select("user_id,full_name,about,phone").eq("user_id", uB.id).maybeSingle()
  );
  await expectDenied("Seeker A cannot UPDATE Seeker B seeker_profiles", async () =>
    seekerA.from("seeker_profiles").update({ about: "HACKED" }).eq("user_id", uB.id).select("user_id")
  );
  {
    const before = certA.verification_status;
    const { data, error } = await seekerA
      .from("seeker_certificates")
      .update({ verification_status: "submitted", verified_at: null, verified_by: null })
      .eq("id", certA.id)
      .select("id,verification_status")
      .maybeSingle();
    const { data: after } = await admin
      .from("seeker_certificates")
      .select("verification_status")
      .eq("id", certA.id)
      .single();
    const unchanged = after?.verification_status === before;
    // Update may appear to succeed but trigger must restore; or column grant may deny.
    if (error && /permission|policy|column/i.test(error.message)) {
      record("Seeker A cannot change own verification_status", true, error.message);
    } else if (unchanged) {
      record("Seeker A cannot change own verification_status", true, "trigger restored");
    } else {
      record(
        "Seeker A cannot change own verification_status",
        false,
        `became ${after?.verification_status}; client=${JSON.stringify(data)}`
      );
    }
  }
  {
    const { error } = await seekerA
      .from("job_applications")
      .update({ match_score: 1 })
      .eq("id", appA.id)
      .select("id,match_score");
    const { data: after } = await admin
      .from("job_applications")
      .select("match_score")
      .eq("id", appA.id)
      .single();
    if (error && /permission|policy|column/i.test(error.message)) {
      record("Seeker A cannot change own match_score", true, error.message);
    } else if (after?.match_score === 77) {
      record("Seeker A cannot change own match_score", true, "unchanged");
    } else {
      record("Seeker A cannot change own match_score", false, `score=${after?.match_score}`);
    }
  }
  await expectDenied("Seeker A cannot SELECT Seeker B seeker_work_capacity", async () =>
    seekerA.from("seeker_work_capacity").select("user_id,status").eq("user_id", uB.id).maybeSingle()
  );
  await expectDenied("Seeker A cannot SELECT Seeker B private certificates", async () =>
    seekerA.from("seeker_certificates").select("id,certificate_name").eq("user_id", uB.id)
  );

  console.log("\n--- Negative: Employer A ---");
  await expectDenied("Employer A cannot UPDATE Employer B employer_profiles", async () =>
    employerA
      .from("employer_profiles")
      .update({ company_name: "Hijacked" })
      .eq("id", epB.id)
      .select("id,company_name")
  );
  await expectDenied("Employer A cannot UPDATE Employer B job_posts", async () =>
    employerA.from("job_posts").update({ title: "Hijacked" }).eq("id", jobB.id).select("id,title")
  );
  await expectDenied("Employer A cannot SELECT Employer B applications", async () =>
    employerA.from("job_applications").select("id,seeker_user_id").eq("id", appB.id).maybeSingle()
  );
  await expectDenied("Employer A cannot SELECT seeker_work_capacity", async () =>
    employerA.from("seeker_work_capacity").select("user_id,status").eq("user_id", uB.id).maybeSingle()
  );
  await expectDenied(
    "Employer A cannot SELECT private seeker certificates without allowed flow",
    async () =>
      employerA.from("seeker_certificates").select("id,certificate_name,user_id").eq("user_id", uB.id)
  );

  console.log("\n--- Negative: Anon ---");
  await expectDenied("Anon cannot SELECT private seeker_profiles", async () =>
    anon.from("seeker_profiles").select("user_id,full_name").eq("user_id", uB.id).maybeSingle()
  );
  await expectDenied("Anon cannot SELECT profiles", async () =>
    anon.from("profiles").select("id,email,role").eq("id", uA.id).maybeSingle()
  );
  await expectDenied("Anon cannot SELECT draft job_posts", async () =>
    anon.from("job_posts").select("id,title,status").eq("id", jobADraft.id).maybeSingle()
  );
  await expectDenied("Anon cannot INSERT seeker_profiles", async () =>
    anon.from("seeker_profiles").insert({
      user_id: "00000000-0000-4000-8000-000000000099",
      full_name: "Anon",
    })
  );
  await expectDenied("Anon cannot INSERT job_applications", async () =>
    anon.from("job_applications").insert({
      job_post_id: jobAPub.id,
      seeker_user_id: uA.id,
      consent_to_share: true,
      shared_profile: {},
    })
  );
  await expectDenied("Anon cannot UPDATE profiles", async () =>
    anon.from("profiles").update({ role: "admin" }).eq("id", uA.id).select("id")
  );

  console.log("\n--- Positive owner flows ---");
  await expectOk("Seeker A can SELECT own seeker_profiles", async () =>
    seekerA.from("seeker_profiles").select("user_id,full_name").eq("user_id", uA.id).single()
  );
  await expectOk("Seeker A can UPDATE own seeker_profiles.about", async () =>
    seekerA.from("seeker_profiles").update({ about: "updated by A" }).eq("user_id", uA.id).select("about").single()
  );
  await expectOk("Seeker A can SELECT own certificates", async () =>
    seekerA.from("seeker_certificates").select("id").eq("user_id", uA.id)
  );
  await expectOk("Seeker A can UPDATE own certificate name", async () =>
    seekerA
      .from("seeker_certificates")
      .update({ certificate_name: "Cert A Renamed" })
      .eq("id", certA.id)
      .select("certificate_name")
      .single()
  );
  await expectOk("Seeker A can withdraw own application (status→withdrawn)", async () =>
    seekerA
      .from("job_applications")
      .update({ status: "withdrawn", updated_at: new Date().toISOString() })
      .eq("id", appA.id)
      .select("status")
      .single()
  );
  await expectOk("Employer A can SELECT own employer_profiles", async () =>
    employerA.from("employer_profiles").select("id,company_name").eq("id", epA.id).single()
  );
  await expectOk("Employer A can SELECT own draft job_posts", async () =>
    employerA.from("job_posts").select("id,status").eq("id", jobADraft.id).single()
  );
  await expectOk("Employer A can UPDATE own job_posts title", async () =>
    employerA
      .from("job_posts")
      .update({ title: "Employer A Draft Updated" })
      .eq("id", jobADraft.id)
      .select("title")
      .single()
  );
  await expectOk("Employer A can SELECT own job applications", async () =>
    employerA.from("job_applications").select("id").eq("job_post_id", jobAPub.id)
  );
  await expectOk("Anon can SELECT published job_posts", async () =>
    anon.from("job_posts").select("id,status").eq("id", jobAPub.id).single()
  );
  await expectOk("Seeker B can SELECT own work_capacity", async () =>
    seekerB.from("seeker_work_capacity").select("user_id,status").eq("user_id", uB.id).single()
  );
} catch (e) {
  console.error("\nSUITE ERROR:", e?.message || e);
  record("Suite setup/execution", false, e?.message || String(e));
} finally {
  console.log("\n--- Cleanup ---");
  for (const id of [ids.seekerA, ids.seekerB, ids.employerA, ids.employerB]) {
    try {
      await cleanupUser(id);
    } catch (e) {
      console.warn("cleanup failed", id, e?.message || e);
    }
  }
}

const failed = results.filter((r) => !r.pass);
console.log("\n========== SUMMARY ==========");
for (const r of results) {
  console.log(`${r.pass ? "PASS" : "FAIL"}\t${r.name}`);
}
console.log(`\nTotal ${results.length} | PASS ${results.length - failed.length} | FAIL ${failed.length}`);
process.exit(failed.length ? 1 : 0);
