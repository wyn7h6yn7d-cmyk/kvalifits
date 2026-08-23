import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildProcessedCarouselLogoStoragePath,
  extractAvatarsStoragePathFromLogoUrl,
} from "@/lib/employer/carouselLogoPaths";
import { isEmployerOriginalLogoStoragePath } from "@/lib/employer/carouselLogo";
import { processCarouselLogoWithSharp } from "@/lib/employer/processCarouselLogoWithSharp";

export type ProcessEmployerCarouselLogoResult =
  | { ok: true; carouselLogoPath: string }
  | { ok: false; reason: string };

type EmployerRow = {
  id: string;
  owner_user_id: string;
  logo_url: string | null;
};

/** Service-role only: set processed carousel asset path without touching approval flags. */
export async function setEmployerProcessedCarouselLogoPath(
  admin: SupabaseClient,
  employerProfileId: string,
  carouselLogoPath: string | null,
): Promise<void> {
  const { error } = await admin
    .from("employer_profiles")
    .update({ carousel_logo_path: carouselLogoPath })
    .eq("id", employerProfileId);
  if (error) throw error;
}

export async function processEmployerCarouselLogo(
  admin: SupabaseClient,
  employer: EmployerRow,
): Promise<ProcessEmployerCarouselLogoResult> {
  const logoUrl = (employer.logo_url ?? "").toString().trim();
  if (!logoUrl) return { ok: false, reason: "missing_original_logo" };

  const sourcePath = extractAvatarsStoragePathFromLogoUrl(logoUrl);
  if (!sourcePath || !isEmployerOriginalLogoStoragePath(sourcePath)) {
    return { ok: false, reason: "invalid_original_logo_path" };
  }

  const { data: blob, error: downloadErr } = await admin.storage.from("avatars").download(sourcePath);
  if (downloadErr || !blob) {
    await setEmployerProcessedCarouselLogoPath(admin, employer.id, null);
    return { ok: false, reason: "download_failed" };
  }

  const input = Buffer.from(await blob.arrayBuffer());
  const processed = await processCarouselLogoWithSharp(input);
  if (!processed.ok) {
    await setEmployerProcessedCarouselLogoPath(admin, employer.id, null);
    return { ok: false, reason: processed.reason };
  }

  const destPath = buildProcessedCarouselLogoStoragePath(employer.owner_user_id);
  const { error: uploadErr } = await admin.storage.from("avatars").upload(destPath, processed.buffer, {
    upsert: true,
    contentType: "image/png",
  });
  if (uploadErr) {
    await setEmployerProcessedCarouselLogoPath(admin, employer.id, null);
    return { ok: false, reason: "upload_failed" };
  }

  await setEmployerProcessedCarouselLogoPath(admin, employer.id, destPath);
  return { ok: true, carouselLogoPath: destPath };
}
