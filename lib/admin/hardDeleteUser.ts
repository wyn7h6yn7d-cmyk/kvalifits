import type { SupabaseClient } from "@supabase/supabase-js";

function isMissingObject(message: string | undefined) {
  return /does not exist|schema cache|relation|could not find/i.test(message ?? "");
}

async function deleteEq(
  admin: SupabaseClient,
  table: string,
  column: string,
  value: string,
) {
  const { error } = await admin.from(table).delete().eq(column, value);
  if (error && !isMissingObject(error.message)) throw error;
}

async function deleteIn(
  admin: SupabaseClient,
  table: string,
  column: string,
  values: string[],
) {
  if (!values.length) return;
  const { error } = await admin.from(table).delete().in(column, values);
  if (error && !isMissingObject(error.message)) throw error;
}

async function removeStorageFolder(admin: SupabaseClient, bucket: string, prefix: string) {
  try {
    const { data } = await admin.storage.from(bucket).list(prefix, { limit: 100 });
    if (!data?.length) return;
    await admin.storage.from(bucket).remove(data.map((f) => `${prefix}/${f.name}`));
  } catch {
    // Folder may be missing.
  }
}

/**
 * Permanently erase a non-admin user so the same email can register again.
 * Uses the service-role client. Never call from the browser.
 */
export async function runAdminHardDeleteUser(opts: {
  admin: SupabaseClient;
  targetUserId: string;
}): Promise<{ email: string | null; role: string | null }> {
  const { admin, targetUserId } = opts;

  const { data: authData, error: authErr } = await admin.auth.admin.getUserById(targetUserId);
  if (authErr) throw authErr;
  const authUser = authData.user;
  if (!authUser) throw new Error("user_not_found");

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", targetUserId)
    .maybeSingle();
  const role =
    ((profile as { role?: string | null } | null)?.role ??
      (authUser.user_metadata as { role?: string } | undefined)?.role ??
      null) ||
    null;
  if (role === "admin") throw new Error("cannot_delete_admin");

  const { data: certs } = await admin
    .from("seeker_certificates")
    .select("certificate_image_url")
    .eq("user_id", targetUserId);
  const certPaths = (certs ?? [])
    .map((c) => (c.certificate_image_url ?? "").toString().trim())
    .filter((p) => p && !p.startsWith("http"));
  if (certPaths.length) {
    await admin.storage.from("certificates").remove(certPaths);
  }
  await removeStorageFolder(admin, "certificates", targetUserId);
  await removeStorageFolder(admin, "resumes", `${targetUserId}/cv`);
  await removeStorageFolder(admin, "avatars", targetUserId);
  await removeStorageFolder(admin, "avatars", `${targetUserId}/employer-logo`);
  await removeStorageFolder(admin, "avatars", `${targetUserId}/cv`);

  await deleteEq(admin, "seeker_certificates", "user_id", targetUserId);
  await deleteEq(admin, "seeker_education", "seeker_user_id", targetUserId);
  await deleteEq(admin, "seeker_workplace_needs", "user_id", targetUserId);
  await deleteEq(admin, "seeker_work_capacity", "user_id", targetUserId);
  await deleteEq(admin, "saved_jobs", "seeker_user_id", targetUserId);
  await deleteEq(admin, "saved_search_alert_deliveries", "seeker_user_id", targetUserId);
  await deleteEq(admin, "saved_job_searches", "seeker_user_id", targetUserId);
  await deleteEq(admin, "job_applications", "seeker_user_id", targetUserId);
  await deleteEq(admin, "job_post_reports", "reporter_user_id", targetUserId);
  await deleteEq(admin, "seeker_profiles", "user_id", targetUserId);

  const { data: employer, error: employerErr } = await admin
    .from("employer_profiles")
    .select("id")
    .eq("owner_user_id", targetUserId)
    .maybeSingle();
  if (employerErr && !isMissingObject(employerErr.message)) throw employerErr;

  const employerId = (employer as { id?: string } | null)?.id;
  if (employerId) {
    await deleteEmployerJobsAndProfile(admin, employerId);
  }

  await deleteEq(admin, "profiles", "id", targetUserId);

  await admin.auth.admin.signOut(targetUserId, "global");
  const del = await admin.auth.admin.deleteUser(targetUserId);
  if (del.error) throw del.error;

  return { email: authUser.email ?? null, role };
}

export async function deleteJobPostsByIds(admin: SupabaseClient, jobIds: string[]) {
  await deleteIn(admin, "saved_jobs", "job_post_id", jobIds);
  await deleteIn(admin, "job_applications", "job_post_id", jobIds);
  await deleteIn(admin, "job_post_reports", "job_post_id", jobIds);
  await deleteIn(admin, "job_posts", "id", jobIds);
}

async function deleteEmployerJobsAndProfile(admin: SupabaseClient, employerId: string) {
  const { data: jobs, error: jobsErr } = await admin
    .from("job_posts")
    .select("id")
    .eq("employer_profile_id", employerId);
  if (jobsErr && !isMissingObject(jobsErr.message)) throw jobsErr;
  const jobIds = (jobs ?? []).map((j) => String(j.id)).filter(Boolean);
  await deleteJobPostsByIds(admin, jobIds);
  await deleteEq(admin, "job_posts", "employer_profile_id", employerId);
  await deleteEq(admin, "employer_profiles", "id", employerId);
  return jobIds.length;
}

/** Permanently remove one job post and related applications / saves / reports. */
export async function runAdminHardDeleteJob(opts: {
  admin: SupabaseClient;
  jobId: string;
}): Promise<{ title: string | null; employerProfileId: string | null }> {
  const { admin, jobId } = opts;
  const { data, error } = await admin
    .from("job_posts")
    .select("id,title,employer_profile_id")
    .eq("id", jobId)
    .maybeSingle();
  if (error && !isMissingObject(error.message)) throw error;
  if (!data) throw new Error("job_not_found");

  await deleteJobPostsByIds(admin, [jobId]);
  return {
    title: ((data as { title?: string | null }).title ?? null) as string | null,
    employerProfileId: ((data as { employer_profile_id?: string | null }).employer_profile_id ?? null) as
      | string
      | null,
  };
}

/**
 * Permanently remove a company profile and all of its job posts.
 * Does not delete the owner user account.
 */
export async function runAdminHardDeleteEmployer(opts: {
  admin: SupabaseClient;
  employerId: string;
}): Promise<{ companyName: string | null; ownerUserId: string | null; jobCount: number }> {
  const { admin, employerId } = opts;
  const { data, error } = await admin
    .from("employer_profiles")
    .select("id,company_name,owner_user_id")
    .eq("id", employerId)
    .maybeSingle();
  if (error && !isMissingObject(error.message)) throw error;
  if (!data) throw new Error("employer_not_found");

  const ownerUserId = ((data as { owner_user_id?: string | null }).owner_user_id ?? null) as string | null;
  if (ownerUserId) {
    await removeStorageFolder(admin, "avatars", `${ownerUserId}/employer-logo`);
  }

  const jobCount = await deleteEmployerJobsAndProfile(admin, employerId);
  return {
    companyName: ((data as { company_name?: string | null }).company_name ?? null) as string | null,
    ownerUserId,
    jobCount,
  };
}
