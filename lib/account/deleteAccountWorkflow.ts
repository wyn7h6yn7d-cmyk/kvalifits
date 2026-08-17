/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { AccountEraseCategory, AccountRetentionCategory } from "@/lib/account/privacyCategories";
import {
  insertLegalRetentionRecords,
  retentionSubjectKey,
  type RetentionInsert,
} from "@/lib/account/retention";

export type DeleteAccountResult = {
  ok: true;
  retentionSubjectKey: string;
  erasedCategories: AccountEraseCategory[];
  retainedCategories: AccountRetentionCategory[];
};

/**
 * Server-side account deletion / anonymisation workflow.
 * Never call from the browser against profile rows alone.
 *
 * Order:
 * 1) Snapshot anonymised legal-retention payloads
 * 2) Erase personal data / files
 * 3) End all sessions
 * 4) Delete auth user (cascades remaining FKs)
 * 5) Write deletion audit event
 */
export async function runDeleteAccountWorkflow(opts: {
  admin: SupabaseClient;
  user: User;
  role: string | null;
}): Promise<DeleteAccountResult> {
  const { admin, user, role } = opts;
  const userId = user.id;
  const subjectKey = retentionSubjectKey(userId);
  const deletedAt = new Date();
  const erased: AccountEraseCategory[] = [];
  const retained: AccountRetentionCategory[] = [];

  try {
    const retentionRecords = await buildRetentionSnapshots(admin, userId, role);
    if (retentionRecords.length) {
      await insertLegalRetentionRecords(admin, subjectKey, retentionRecords, deletedAt);
      for (const r of retentionRecords) {
        if (!retained.includes(r.category)) retained.push(r.category);
      }
    }

    // Always keep a security-audit deletion marker (no PII).
    await insertLegalRetentionRecords(
      admin,
      subjectKey,
      [
        {
          category: "security_audit",
          payload: {
            event: "account_deleted",
            role: role ?? null,
            at: deletedAt.toISOString(),
          },
        },
      ],
      deletedAt
    );
    if (!retained.includes("security_audit")) retained.push("security_audit");

    await erasePersonalData(admin, userId, erased);

    // End all refresh sessions for this user before removing the auth identity.
    const signOutRes = await admin.auth.admin.signOut(userId, "global");
    if (signOutRes.error) {
      // Continue — deleteUser also invalidates access; log via event if needed.
    } else {
      erased.push("sessions");
    }

    const delUser = await admin.auth.admin.deleteUser(userId);
    if (delUser.error) throw delUser.error;
    erased.push("auth_identity");

    await admin.from("account_deletion_events").insert({
      retention_subject_key: subjectKey,
      role: role ?? null,
      status: "completed",
      erased_categories: erased,
      retained_categories: retained,
    });

    return {
      ok: true,
      retentionSubjectKey: subjectKey,
      erasedCategories: erased,
      retainedCategories: retained,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await admin.from("account_deletion_events").insert({
      retention_subject_key: subjectKey,
      role: role ?? null,
      status: "failed",
      erased_categories: erased,
      retained_categories: retained,
      error_message: message.slice(0, 2000),
    });
    throw err;
  }
}

async function buildRetentionSnapshots(
  admin: SupabaseClient,
  userId: string,
  role: string | null
): Promise<RetentionInsert[]> {
  const records: RetentionInsert[] = [];

  const { data: apps } = await admin
    .from("job_applications")
    .select("id,job_post_id,created_at,status")
    .eq("seeker_user_id", userId);

  if (apps?.length) {
    records.push({
      category: "dispute_resolution",
      payload: {
        kind: "seeker_applications_summary",
        count: apps.length,
        items: apps.map((a: any) => ({
          applicationId: a.id,
          jobPostId: a.job_post_id,
          createdAt: a.created_at,
          status: a.status ?? null,
        })),
      },
    });
  }

  const { data: employer } = await admin
    .from("employer_profiles")
    .select("id")
    .eq("owner_user_id", userId)
    .maybeSingle();

  if (employer?.id) {
    const { data: jobs } = await admin
      .from("job_posts")
      .select("id,title,status,created_at,published_at")
      .eq("employer_profile_id", employer.id);

    const jobIds = (jobs ?? []).map((j: any) => j.id as string);
    let applicationCount = 0;
    if (jobIds.length) {
      const { count } = await admin
        .from("job_applications")
        .select("id", { count: "exact", head: true })
        .in("job_post_id", jobIds);
      applicationCount = count ?? 0;
    }

    records.push({
      category: "dispute_resolution",
      payload: {
        kind: "employer_listings_summary",
        role: role ?? "employer",
        jobCount: jobs?.length ?? 0,
        applicationCount,
        jobs: (jobs ?? []).map((j: any) => ({
          jobPostId: j.id,
          title: (j.title ?? "").toString().slice(0, 120),
          status: j.status,
          createdAt: j.created_at,
          publishedAt: j.published_at ?? null,
        })),
      },
    });
  }

  // Placeholder bucket for future accounting / statutory records (managed separately).
  records.push({
    category: "legal_obligation",
    payload: {
      kind: "retention_bucket_placeholder",
      note: "Reserved for statutory retention items; no personal identifiers.",
      closedAt: new Date().toISOString(),
    },
  });

  return records;
}

async function erasePersonalData(
  admin: SupabaseClient,
  userId: string,
  erased: AccountEraseCategory[]
): Promise<void> {
  // Certificates + storage objects
  const { data: certs } = await admin
    .from("seeker_certificates")
    .select("id,certificate_image_url")
    .eq("user_id", userId);

  const certPaths = (certs ?? [])
    .map((c: any) => (c.certificate_image_url ?? "").toString().trim())
    .filter((p: string) => p && !p.startsWith("http"));
  if (certPaths.length) {
    await admin.storage.from("certificates").remove(certPaths);
  }
  // Common avatar / logo prefixes under avatars bucket
  try {
    const { data: avatarList } = await admin.storage.from("avatars").list(userId, { limit: 100 });
    if (avatarList?.length) {
      await admin.storage
        .from("avatars")
        .remove(avatarList.map((f) => `${userId}/${f.name}`));
    }
    const { data: logoList } = await admin.storage
      .from("avatars")
      .list(`${userId}/employer-logo`, { limit: 50 });
    if (logoList?.length) {
      await admin.storage
        .from("avatars")
        .remove(logoList.map((f) => `${userId}/employer-logo/${f.name}`));
    }
  } catch {
    // Storage list may fail if folder missing — ignore.
  }

  await admin.from("seeker_certificates").delete().eq("user_id", userId);
  erased.push("certificates_and_files");

  await admin.from("seeker_workplace_needs").delete().eq("user_id", userId);
  await admin.from("seeker_work_capacity").delete().eq("user_id", userId);
  erased.push("preferences_and_needs");

  // Strip PII from applications before auth cascade (employer may still need timeline via retention).
  await admin
    .from("job_applications")
    .update({
      cover_letter: null,
      shared_profile: {},
      application_answers: {},
      consent_to_share: false,
    })
    .eq("seeker_user_id", userId);
  erased.push("applications_personal");

  const savedDel = await admin.from("saved_jobs").delete().eq("seeker_user_id", userId);
  if (!savedDel.error) erased.push("saved_jobs");

  const savedSearchDel = await admin.from("saved_job_searches").delete().eq("seeker_user_id", userId);
  if (!savedSearchDel.error) erased.push("saved_job_searches");

  await admin.from("seeker_profiles").delete().eq("user_id", userId);
  erased.push("profile");

  const { data: employer } = await admin
    .from("employer_profiles")
    .select("id")
    .eq("owner_user_id", userId)
    .maybeSingle();

  if (employer?.id) {
    const jobUpdate = await admin
      .from("job_posts")
      .update({
        status: "archived",
        published_at: null,
      })
      .eq("employer_profile_id", employer.id);
    if (!jobUpdate.error) {
      // Best-effort wipe of listing copy (ignore missing-column errors).
      await admin
        .from("job_posts")
        .update({
          short_summary: null,
          description: "[deleted]",
          requirements: null,
        })
        .eq("employer_profile_id", employer.id);
      erased.push("job_posts_personal");
    }

    await admin
      .from("employer_profiles")
      .update({
        company_name: "[deleted]",
        registry_code: null,
        contact_email: `deleted-${subjectSafe(userId)}@invalid.local`,
        contact_phone: null,
        website: null,
        company_description: "[deleted]",
        location: null,
        industry: null,
        logo_url: null,
        company_verified: false,
        verification_status: "unverified",
        verification_source: null,
        verified_at: null,
      })
      .eq("id", employer.id);
    erased.push("employer_company");
  }

  // Clear profile role row PII if any custom columns exist; identity removed with auth user.
  await admin.from("profiles").delete().eq("id", userId);
}

function subjectSafe(userId: string): string {
  return userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12) || "x";
}
