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
  await admin.from("saved_jobs").delete().eq("seeker_user_id", userId);
  await admin.from("saved_search_alert_deliveries").delete().eq("seeker_user_id", userId);
  await admin.from("saved_job_searches").delete().eq("seeker_user_id", userId);
  await admin.from("notifications").delete().eq("user_id", userId);
  await admin.from("seeker_education").delete().eq("seeker_user_id", userId);
  await admin.from("seeker_certificates").delete().eq("user_id", userId);
  try {
    await admin.storage.from("resumes").remove([`${userId}/cv/rls-test.pdf`]);
    await admin.storage.from("avatars").remove([`${userId}/avatar-rls.gif`]);
  } catch {
    // ignore
  }
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

  const { error: certErr } = await admin
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

  const jobBase = {
    application_url: "",
    salary_currency: "EUR",
    required_skills: [],
    keywords: [],
    requirement_lines: [],
    languages: [],
    requirements: "test",
  };

  const { data: jobADraft, error: jobAErr } = await admin
    .from("job_posts")
    .insert({
      ...jobBase,
      employer_profile_id: epA.id,
      created_by: uE.id,
      title: "Employer A Draft",
      slug: `rls-a-draft-${stamp}`,
      location: "Tallinn",
      work_type: "on_site",
      job_type: "full_time",
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
      ...jobBase,
      employer_profile_id: epA.id,
      created_by: uE.id,
      title: "Employer A Published",
      slug: `rls-a-pub-${stamp}`,
      location: "Tallinn",
      work_type: "on_site",
      job_type: "full_time",
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
      ...jobBase,
      employer_profile_id: epB.id,
      created_by: uE2.id,
      title: "Employer B Job SECRET",
      slug: `rls-b-job-${stamp}`,
      location: "Pärnu",
      work_type: "on_site",
      job_type: "full_time",
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

  const { error: savedAErr } = await admin.from("saved_jobs").insert({
    seeker_user_id: uA.id,
    job_post_id: jobAPub.id,
  });
  if (savedAErr) throw new Error(`savedA: ${savedAErr.message}`);

  const tokenA = await signIn(emailA);
  const tokenB = await signIn(emailB);
  const tokenE = await signIn(emailE);
  const tokenE2 = await signIn(emailE2);
  const seekerA = clientForToken(tokenA);
  const seekerB = clientForToken(tokenB);
  const employerA = clientForToken(tokenE);
  const employerB = clientForToken(tokenE2);

  const cvPath = `${uA.id}/cv/rls-test.pdf`;
  const pdfBytes = Buffer.from("%PDF-1.1\n%%EOF\n");
  const gifBytes = Buffer.from(
    "GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\xff\xff\xff!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;",
    "binary"
  );
  const avatarPath = `${uA.id}/avatar-rls.gif`;

  console.log("\n--- Private CV storage ---");
  await expectOk("Seeker A can upload own CV to resumes", async () =>
    seekerA.storage.from("resumes").upload(cvPath, pdfBytes, { contentType: "application/pdf", upsert: true })
  );
  await expectDenied("Anon cannot download seeker CV", async () => anon.storage.from("resumes").download(cvPath));
  await expectDenied("Seeker B cannot download Seeker A CV", async () =>
    seekerB.storage.from("resumes").download(cvPath)
  );
  await expectOk("Seeker A can download own CV", async () => seekerA.storage.from("resumes").download(cvPath));
  await expectDenied("Unauthorized employer cannot download seeker CV", async () =>
    employerB.storage.from("resumes").download(cvPath)
  );
  await expectOk("Employer with consented application can download seeker CV", async () =>
    employerA.storage.from("resumes").download(cvPath)
  );
  await expectOk("Seeker A can upload public avatar/logo image", async () =>
    seekerA.storage.from("avatars").upload(avatarPath, gifBytes, { contentType: "image/gif", upsert: true })
  );
  await expectOk("Anon can read public avatar image", async () => anon.storage.from("avatars").download(avatarPath));

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

  console.log("\n--- Negative: employer_profiles private columns ---");
  await expectDenied("Anon cannot SELECT employer contact_email", async () =>
    anon.from("employer_profiles").select("id,contact_email").eq("id", epA.id).maybeSingle()
  );
  await expectDenied("Seeker cannot SELECT published employer contact_email", async () =>
    seekerA.from("employer_profiles").select("id,contact_email").eq("id", epA.id).maybeSingle()
  );
  await expectDenied("Seeker cannot SELECT published employer registry_code", async () =>
    seekerA.from("employer_profiles").select("id,registry_code").eq("id", epA.id).maybeSingle()
  );
  await expectDenied("Seeker cannot SELECT published employer owner_user_id", async () =>
    seekerA.from("employer_profiles").select("id,owner_user_id").eq("id", epA.id).maybeSingle()
  );
  await expectDenied("Other employer cannot SELECT Employer A contact_email", async () =>
    employerB.from("employer_profiles").select("id,contact_email").eq("id", epA.id).maybeSingle()
  );
  await expectDenied("Seeker cannot SELECT employer search_tsv", async () =>
    seekerA.from("employer_profiles").select("id,search_tsv").eq("id", epA.id).maybeSingle()
  );
  {
    const { data, error } = await seekerA
      .from("employer_public_profiles")
      .select("id,contact_email")
      .eq("id", epA.id)
      .maybeSingle();
    const leaked = Boolean(data && Object.prototype.hasOwnProperty.call(data, "contact_email") && data.contact_email);
    record(
      "Public employer view does not expose contact_email",
      Boolean(error) || !leaked,
      error?.message || (leaked ? "leaked" : "hidden"),
    );
  }
  await expectDenied("Employer A cannot UPDATE Employer B job_posts", async () =>
    employerA.from("job_posts").update({ title: "Hijacked" }).eq("id", jobB.id).select("id,title")
  );
  await expectDenied("Employer A cannot SELECT Employer B applications", async () =>
    employerA.from("job_applications").select("id,seeker_user_id").eq("id", appB.id).maybeSingle()
  );
  await expectDenied("Seeker B cannot SELECT Seeker A saved_jobs", async () =>
    seekerB.from("saved_jobs").select("id,job_post_id").eq("seeker_user_id", uA.id)
  );
  await expectDenied("Employer A cannot SELECT saved_jobs", async () =>
    employerA.from("saved_jobs").select("id,job_post_id").eq("seeker_user_id", uA.id)
  );
  await expectDenied("Seeker B cannot INSERT a saved job for Seeker A", async () =>
    seekerB.from("saved_jobs").insert({ seeker_user_id: uA.id, job_post_id: jobAPub.id }).select("id")
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
  {
    const { data, error } = await employerA
      .from("employer_profiles")
      .select("id,contact_email")
      .eq("id", epA.id)
      .maybeSingle();
    const pass = !error && (data?.contact_email ?? "") === emailE;
    record("Employer A can SELECT own contact_email", pass, error?.message || data?.contact_email || "");
  }
  {
    const { data, error } = await seekerA
      .from("employer_public_profiles")
      .select("id,company_name")
      .eq("id", epA.id)
      .maybeSingle();
    const pass = !error && Boolean(data?.company_name);
    record(
      "Seeker can SELECT public company_name via employer_public_profiles",
      pass,
      error?.message || (data ? "ok" : "empty"),
    );
  }
  {
    const { data, error } = await anon
      .from("employer_public_profiles")
      .select("id,company_name")
      .eq("id", epA.id)
      .maybeSingle();
    const pass = !error && Boolean(data?.company_name);
    record(
      "Anon can SELECT public company_name via employer_public_profiles",
      pass,
      error?.message || (data ? "ok" : "empty"),
    );
  }
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
  await expectOk("Seeker A can SELECT own saved_jobs", async () =>
    seekerA.from("saved_jobs").select("id,job_post_id").eq("seeker_user_id", uA.id).single()
  );
  await expectOk("Employer A can INSERT own job_posts", async () =>
    employerA
      .from("job_posts")
      .insert({
        ...jobBase,
        employer_profile_id: epA.id,
        created_by: uE.id,
        title: "Employer A Created",
        slug: `rls-a-create-${stamp}`,
        location: "Tallinn",
        work_type: "on_site",
        job_type: "full_time",
        short_summary: "created by A",
        description: "created by A body",
        status: "draft",
        application_type: "in_app",
      })
      .select("id")
      .single()
  );
  await expectOk("Anon can SELECT published job_posts", async () =>
    anon.from("job_posts").select("id,status").eq("id", jobAPub.id).single()
  );
  await expectOk("Seeker B can SELECT own work_capacity", async () =>
    seekerB.from("seeker_work_capacity").select("user_id,status").eq("user_id", uB.id).single()
  );

  console.log("\n--- Seeker education ---");
  {
    const { data: eduA, error: eduAErr } = await seekerA
      .from("seeker_education")
      .insert({
        seeker_user_id: uA.id,
        institution: "TalTech",
        field_of_study: "Informatics",
        degree_or_level: "bachelor",
        start_year: 2018,
        end_year: 2022,
        currently_studying: false,
      })
      .select("id,institution")
      .single();
    if (eduAErr || !eduA?.id) {
      record(
        "seeker_education table is available for RLS tests",
        false,
        eduAErr?.message || "insert failed — apply 20260819150000_seeker_education.sql",
      );
    } else {
      record("Seeker A can INSERT own education", true);
      await expectOk("Seeker A can SELECT own education", async () =>
        seekerA.from("seeker_education").select("id,institution").eq("id", eduA.id).single()
      );
      await expectOk("Seeker A can UPDATE own education", async () =>
        seekerA
          .from("seeker_education")
          .update({ institution: "TalTech (updated)" })
          .eq("id", eduA.id)
          .select("institution")
          .single()
      );

      const { data: eduB, error: eduBErr } = await admin
        .from("seeker_education")
        .insert({
          seeker_user_id: uB.id,
          institution: "Secret Uni B",
          field_of_study: "Law",
          degree_or_level: "master",
          start_year: 2020,
          end_year: 2022,
          currently_studying: false,
        })
        .select("id")
        .single();
      if (eduBErr || !eduB?.id) {
        record("Admin can seed Seeker B education for RLS tests", false, eduBErr?.message || "missing id");
      } else {
        await expectDenied("Seeker A cannot SELECT Seeker B education", async () =>
          seekerA.from("seeker_education").select("id,institution").eq("id", eduB.id).maybeSingle()
        );
        await expectDenied("Seeker A cannot UPDATE Seeker B education", async () =>
          seekerA
            .from("seeker_education")
            .update({ institution: "Hacked" })
            .eq("id", eduB.id)
            .select("id")
        );
        await expectDenied("Employer A cannot SELECT private-profile seeker education", async () =>
          employerA.from("seeker_education").select("id,institution").eq("id", eduB.id).maybeSingle()
        );
      }

      await expectDenied("Employer A cannot INSERT seeker education", async () =>
        employerA
          .from("seeker_education")
          .insert({
            seeker_user_id: uA.id,
            institution: "Employer Uni",
            degree_or_level: "other",
            start_year: 2020,
            currently_studying: false,
          })
          .select("id")
      );
      await expectDenied("Anon cannot SELECT seeker education", async () =>
        anon.from("seeker_education").select("id").eq("id", eduA.id).maybeSingle()
      );
      await expectOk("Employer A can SELECT consented applicant education", async () =>
        employerA.from("seeker_education").select("id,institution").eq("id", eduA.id).single()
      );
      await expectOk("Seeker A can DELETE own education", async () =>
        seekerA.from("seeker_education").delete().eq("id", eduA.id).select("id")
      );
    }
  }

  console.log("\n--- In-app notifications ---");
  {
    const { data: nA, error: nAErr } = await admin
      .from("notifications")
      .insert({
        user_id: uA.id,
        type: "certificate_reviewed",
        entity_type: "seeker_certificate",
        entity_id: certA.id,
        payload: { verification_status: "verified" },
      })
      .select("id")
      .single();
    const { data: nB, error: nBErr } = await admin
      .from("notifications")
      .insert({
        user_id: uB.id,
        type: "application_status_changed",
        entity_type: "job_application",
        payload: { status: "interview" },
      })
      .select("id")
      .single();
    if (nAErr || nBErr || !nA?.id || !nB?.id) {
      record(
        "notifications table is available for RLS tests",
        false,
        nAErr?.message || nBErr?.message || "insert failed — apply 20260819120000_notifications.sql",
      );
    } else {
      record("notifications table is available for RLS tests", true);
      await expectOk("Seeker A can SELECT own notification", async () =>
        seekerA.from("notifications").select("id,type,read_at").eq("id", nA.id).single()
      );
      await expectDenied("Seeker A cannot SELECT Seeker B notification", async () =>
        seekerA.from("notifications").select("id,type").eq("id", nB.id).maybeSingle()
      );
      await expectDenied("Anon cannot SELECT notifications", async () =>
        anon.from("notifications").select("id").eq("id", nA.id).maybeSingle()
      );
      await expectDenied("Seeker A cannot INSERT notifications", async () =>
        seekerA
          .from("notifications")
          .insert({
            user_id: uA.id,
            type: "strong_match",
            payload: {},
          })
          .select("id")
      );
      await expectOk("Seeker A can mark own notification read", async () =>
        seekerA
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("id", nA.id)
          .select("id,read_at")
          .single()
      );
      {
        const { error } = await seekerA
          .from("notifications")
          .update({ type: "strong_match" })
          .eq("id", nA.id)
          .select("id,type");
        const { data: after } = await admin.from("notifications").select("type").eq("id", nA.id).single();
        const blocked = Boolean(error) || after?.type === "certificate_reviewed";
        record(
          "Seeker A cannot change notification type",
          blocked,
          error?.message || `type=${after?.type}`,
        );
      }
      await expectDenied("Seeker A cannot mark Seeker B notification read", async () =>
        seekerA
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("id", nB.id)
          .select("id,read_at")
      );
      await expectDenied("Seeker A cannot UPDATE another user's user_id", async () =>
        seekerA.from("notifications").update({ user_id: uA.id }).eq("id", nB.id).select("id")
      );
    }
  }

  console.log("\n--- Saved search delivery cursors ---");
  {
    const { data: searchA, error: searchAErr } = await seekerA
      .from("saved_job_searches")
      .insert({
        seeker_user_id: uA.id,
        name: "RLS search",
        query: "nurse",
        filters: [],
        require_public_salary: false,
        min_match_percent: 80,
        frequency: "daily",
        enabled: true,
        locale: "et",
        search_fingerprint: `rls-${stamp}`,
      })
      .select("id,last_notified_at,notify_after,enabled")
      .single();
    if (searchAErr || !searchA?.id) {
      record(
        "saved_job_searches insert is available for RLS tests",
        false,
        searchAErr?.message || "insert failed — apply 20260819140000_saved_search_alert_delivery.sql",
      );
    } else {
      record("Seeker A can INSERT own saved search without delivery cursors", true);
      record(
        "JWT insert cannot set last_notified_at",
        searchA.last_notified_at == null,
        `last_notified_at=${searchA.last_notified_at}`,
      );

      await expectDenied("Seeker A cannot INSERT last_notified_at", async () =>
        seekerA
          .from("saved_job_searches")
          .insert({
            seeker_user_id: uA.id,
            name: "forge",
            query: "",
            filters: [],
            search_fingerprint: `rls-forge-${stamp}`,
            last_notified_at: "2020-01-01T00:00:00Z",
          })
          .select("id")
      );

      {
        const { error } = await seekerA
          .from("saved_job_searches")
          .update({
            last_notified_at: "2020-01-01T00:00:00Z",
            notify_after: "2020-01-01T00:00:00Z",
          })
          .eq("id", searchA.id)
          .select("id");
        const { data: after } = await admin
          .from("saved_job_searches")
          .select("last_notified_at,notify_after")
          .eq("id", searchA.id)
          .single();
        const cursorUntouched =
          after?.last_notified_at == null &&
          String(after?.notify_after ?? "") !== "2020-01-01T00:00:00+00:00" &&
          !String(after?.notify_after ?? "").startsWith("2020-01-01");
        record(
          "Seeker A cannot forge last_notified_at or notify_after",
          Boolean(error) || cursorUntouched,
          error?.message || `notify_after=${after?.notify_after}`,
        );
      }

      await expectOk("Seeker A can UPDATE enabled on own saved search", async () =>
        seekerA
          .from("saved_job_searches")
          .update({ enabled: false })
          .eq("id", searchA.id)
          .select("id,enabled")
          .single()
      );

      await expectDenied("Seeker A cannot SELECT delivery ledger", async () =>
        seekerA.from("saved_search_alert_deliveries").select("id").limit(1)
      );
      await expectDenied("Seeker A cannot INSERT delivery ledger", async () =>
        seekerA
          .from("saved_search_alert_deliveries")
          .insert({
            saved_search_id: searchA.id,
            job_post_id: jobAPub.id,
            seeker_user_id: uA.id,
          })
          .select("id")
      );
      await expectDenied("Anon cannot SELECT delivery ledger", async () =>
        anon.from("saved_search_alert_deliveries").select("id").limit(1)
      );
    }
  }

  console.log("\n--- Employer candidate discovery RPC ---");
  {
    const emptyArgs = {
      p_query: null,
      p_page: 1,
      p_page_size: 24,
    };
    const seekerRpc = await seekerA.rpc("search_discoverable_candidates", emptyArgs);
    if (seekerRpc.error && /schema cache|does not exist|function/i.test(seekerRpc.error.message ?? "")) {
      record(
        "search_discoverable_candidates is available for RLS tests",
        false,
        `${seekerRpc.error.message} — apply 20260819170000_search_discoverable_candidates.sql`,
      );
    } else {
      const seekerItems = Array.isArray(seekerRpc.data?.candidates) ? seekerRpc.data.candidates : [];
      record(
        "Seeker cannot discover candidates via RPC",
        Boolean(seekerRpc.error) || seekerItems.length === 0,
        seekerRpc.error?.message || `count=${seekerItems.length}`,
      );

      const anonRpc = await anon.rpc("search_discoverable_candidates", emptyArgs);
      const anonItems = Array.isArray(anonRpc.data?.candidates) ? anonRpc.data.candidates : [];
      record(
        "Anon cannot discover candidates via RPC",
        Boolean(anonRpc.error) || anonItems.length === 0,
        anonRpc.error?.message || `count=${anonItems.length}`,
      );

      const employerRpc = await employerA.rpc("search_discoverable_candidates", emptyArgs);
      if (employerRpc.error) {
        record("Employer can execute search_discoverable_candidates", false, employerRpc.error.message);
      } else {
        record("Employer can execute search_discoverable_candidates", true);
        const payload = employerRpc.data ?? {};
        const items = Array.isArray(payload.candidates) ? payload.candidates : [];
        record(
          "Discovery RPC returns total_count and page info",
          Number.isFinite(Number(payload.total_count)) &&
            Number.isFinite(Number(payload.current_page)) &&
            Number.isFinite(Number(payload.page_size)),
          `total=${payload.total_count} page=${payload.current_page} size=${payload.page_size}`,
        );
        record(
          "Discovery RPC page size stays at most 30",
          Number(payload.page_size) <= 30 && items.length <= 30,
          `size=${payload.page_size} items=${items.length}`,
        );
        const leaked = items.some(
          (row) =>
            row &&
            typeof row === "object" &&
            (Object.prototype.hasOwnProperty.call(row, "phone") ||
              Object.prototype.hasOwnProperty.call(row, "cv_url") ||
              Object.prototype.hasOwnProperty.call(row, "date_of_birth") ||
              Object.prototype.hasOwnProperty.call(row, "about") ||
              Object.prototype.hasOwnProperty.call(row, "certificate_image_url") ||
              Object.prototype.hasOwnProperty.call(row, "certificate_number")),
        );
        record("Discovery RPC does not include private profile or document fields", !leaked);
        const hiddenB = items.some((row) => row?.user_id === uB.id);
        record("Discovery RPC does not return hidden seeker B", !hiddenB);

        const page1 = await employerA.rpc("search_discoverable_candidates", { ...emptyArgs, p_page: 1, p_page_size: 24 });
        const page2 = await employerA.rpc("search_discoverable_candidates", { ...emptyArgs, p_page: 2, p_page_size: 24 });
        const ids1 = new Set((page1.data?.candidates ?? []).map((row) => row?.user_id).filter(Boolean));
        const ids2 = (page2.data?.candidates ?? []).map((row) => row?.user_id).filter(Boolean);
        const overlap = ids2.some((id) => ids1.has(id));
        record(
          "Discovery RPC page 2 does not overlap page 1 when both have rows",
          ids2.length === 0 || !overlap,
          `page1=${ids1.size} page2=${ids2.length}`,
        );
      }
    }
  }
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
