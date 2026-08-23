import { ADMIN_AUDIT_ACTIONS, tryWriteAdminAuditLog } from "@/lib/admin/auditLog";
import { updateEmployerHomepageCarousel } from "@/lib/admin/updateEmployerHomepageCarousel";
import { adminApiJson, requireAdminApiActor } from "@/lib/admin/requireAdminApi";
import { buildCarouselLogoStoragePath } from "@/lib/employer/carouselLogo";
import { extractAvatarsStoragePathFromLogoUrl } from "@/lib/employer/carouselLogoPaths";
import { prepareRasterImageForUpload } from "@/lib/uploads/prepareUploadFile";
import { errorMessageFromUnknown } from "@/lib/utils";
import { reportException } from "@/lib/monitoring/report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PatchBody = {
  employerId?: string;
  showOnHomepage?: boolean;
  homepageLogoApproved?: boolean;
  useLogoPlate?: boolean;
  useOriginalOnPlate?: boolean;
  clearCarouselLogo?: boolean;
};

export async function PATCH(req: Request) {
  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return adminApiJson({ error: "invalid_json" }, 400);
  }

  const employerId = (body.employerId ?? "").toString().trim();
  if (!employerId) return adminApiJson({ error: "missing_employer_id" }, 400);

  const gate = await requireAdminApiActor();
  if (!gate.ok) return gate.response;

  try {
    const patch: Parameters<typeof updateEmployerHomepageCarousel>[1] = { employerProfileId: employerId };

    if (body.useOriginalOnPlate) {
      const { data: row, error: loadErr } = await gate.admin
        .from("employer_profiles")
        .select("logo_url")
        .eq("id", employerId)
        .maybeSingle();
      if (loadErr || !row) return adminApiJson({ error: "employer_not_found" }, 404);
      const originalPath = extractAvatarsStoragePathFromLogoUrl(row.logo_url);
      if (!originalPath) return adminApiJson({ error: "missing_original_logo" }, 400);
      patch.carouselLogoPath = originalPath;
      patch.useLogoPlate = true;
      patch.homepageLogoApproved = false;
      patch.showOnHomepage = false;
    } else {
      if (typeof body.showOnHomepage === "boolean") patch.showOnHomepage = body.showOnHomepage;
      if (typeof body.homepageLogoApproved === "boolean") patch.homepageLogoApproved = body.homepageLogoApproved;
      if (typeof body.useLogoPlate === "boolean") patch.useLogoPlate = body.useLogoPlate;
      if (body.clearCarouselLogo) patch.carouselLogoPath = null;
    }

    await updateEmployerHomepageCarousel(gate.admin, patch);

    await tryWriteAdminAuditLog(gate.admin, {
      actorId: gate.user.id,
      action: ADMIN_AUDIT_ACTIONS.employerUpdate,
      targetType: "employer",
      targetId: employerId,
      details: {
        show_on_homepage: body.showOnHomepage,
        homepage_logo_approved: body.homepageLogoApproved,
        use_logo_plate: body.useLogoPlate,
        use_original_on_plate: body.useOriginalOnPlate ?? false,
        clear_carousel_logo: body.clearCarouselLogo ?? false,
      },
    });

    return adminApiJson({ ok: true });
  } catch (err) {
    const message = errorMessageFromUnknown(err, "update_failed");
    reportException(err, { area: "api", code: "admin_homepage_carousel_patch" });
    return adminApiJson({ error: "update_failed", message }, 500);
  }
}

export async function POST(req: Request) {
  const gate = await requireAdminApiActor();
  if (!gate.ok) return gate.response;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return adminApiJson({ error: "invalid_form" }, 400);
  }

  const employerId = (form.get("employerId") ?? "").toString().trim();
  const ownerUserId = (form.get("ownerUserId") ?? "").toString().trim();
  const file = form.get("file");
  if (!employerId || !ownerUserId) return adminApiJson({ error: "missing_employer_id" }, 400);
  if (!(file instanceof File)) return adminApiJson({ error: "missing_file" }, 400);

  try {
    const prepared = await prepareRasterImageForUpload(file, "employerLogo");
    const ext = (prepared.name.split(".").pop() || "png").toLowerCase();
    if (!["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
      return adminApiJson({ error: "invalid_file_type" }, 400);
    }

    const path = buildCarouselLogoStoragePath(ownerUserId, ext);
    const { error: uploadErr } = await gate.admin.storage.from("avatars").upload(path, prepared, {
      upsert: true,
      contentType: prepared.type || undefined,
    });
    if (uploadErr) throw uploadErr;

    await updateEmployerHomepageCarousel(gate.admin, {
      employerProfileId: employerId,
      carouselLogoPath: path,
      homepageLogoApproved: false,
      showOnHomepage: false,
    });

    await tryWriteAdminAuditLog(gate.admin, {
      actorId: gate.user.id,
      action: ADMIN_AUDIT_ACTIONS.employerUpdate,
      targetType: "employer",
      targetId: employerId,
      details: { carousel_logo_path: path, action: "upload_carousel_logo" },
    });

    return adminApiJson({ ok: true, carouselLogoPath: path });
  } catch (err) {
    const message = errorMessageFromUnknown(err, "upload_failed");
    reportException(err, { area: "api", code: "admin_homepage_carousel_upload" });
    return adminApiJson({ error: "upload_failed", message }, 500);
  }
}
