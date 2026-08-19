import type { SupabaseClient } from "@supabase/supabase-js";

import { reportStorageUploadFailure } from "@/lib/monitoring/report";
import { consumeUploadRateLimit } from "@/lib/uploads/consumeUploadRateLimit";

import { MAX_CV_BYTES } from "@/lib/uploads/prepareUploadFile";
import {
  RESUMES_BUCKET,
  buildCvObjectPath,
  parseCvStorageRef,
} from "@/lib/seeker/cvStorage";

export async function removeCvStorageObject(
  supabase: SupabaseClient,
  value: string | null | undefined,
): Promise<void> {
  const ref = parseCvStorageRef(value);
  if (!ref) return;
  await supabase.storage.from(RESUMES_BUCKET).remove([ref.path]);
  if (ref.legacyPublicAvatars) {
    await supabase.storage.from("avatars").remove([ref.path]);
  }
}

export async function uploadOwnCvPdf(opts: {
  supabase: SupabaseClient;
  userId: string;
  file: File;
  previous: string | null | undefined;
}): Promise<string> {
  const { supabase, userId, file, previous } = opts;
  if (file.size > MAX_CV_BYTES) {
    throw new Error("cv_too_large");
  }
  const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
  if (ext !== "pdf" && file.type !== "application/pdf") {
    throw new Error("cv_not_pdf");
  }

  await consumeUploadRateLimit("cv");

  const path = buildCvObjectPath(userId, file.name);
  const { error: uploadErr } = await supabase.storage.from(RESUMES_BUCKET).upload(path, file, {
    upsert: true,
    contentType: "application/pdf",
  });
  if (uploadErr) {
    reportStorageUploadFailure(uploadErr, "cv");
    throw uploadErr;
  }

  const prev = parseCvStorageRef(previous);
  if (prev && prev.path !== path) {
    await removeCvStorageObject(supabase, previous);
  }
  return path;
}
