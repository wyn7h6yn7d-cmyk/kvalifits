import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmailViaResend } from "@/lib/email/resend";
import { calculateJobMatch } from "@/lib/matching/calculateJobMatch";

type Body = {
  jobPostId?: string;
  coverLetter?: string;
  consentToShare?: boolean;
};

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "not_authed" }, { status: 401 });

    const body = (await req.json()) as Body;
    const jobPostId = (body.jobPostId ?? "").toString().trim();
    const coverLetter = (body.coverLetter ?? "").toString();
    const consentToShare = Boolean(body.consentToShare);

    if (!jobPostId) return NextResponse.json({ error: "missing_job_post_id" }, { status: 400 });
    if (!consentToShare) return NextResponse.json({ error: "missing_consent" }, { status: 400 });

    const admin = createSupabaseAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "missing_service_role_key" }, { status: 500 });
    }

    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("role,email")
      .eq("id", user.id)
      .maybeSingle();
    if (profileErr) throw profileErr;
    if (!profile || profile.role !== "seeker") return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const { data: seeker, error: seekerErr } = await admin
      .from("seeker_profiles")
      .select(
        "full_name,profile_title,phone,location,about,skills,experience_level,preferred_job_types,preferred_locations,cv_url"
      )
      .eq("user_id", user.id)
      .maybeSingle();
    if (seekerErr) throw seekerErr;
    if (!seeker) {
      return NextResponse.json({ error: "seeker_profile_required" }, { status: 400 });
    }

    const { data: certs, error: certErr } = await admin
      .from("seeker_certificates")
      .select("certificate_name,certificate_issuer")
      .eq("user_id", user.id);
    if (certErr) throw certErr;

    const { data: job, error: jobErr } = await admin
      .from("job_posts")
      .select(
        "id,title,location,work_type,job_type,employer_profile_id,status,short_summary,description,requirements,requirement_lines,required_skills,keywords,experience_level_required,certificate_requirements"
      )
      .eq("id", jobPostId)
      .maybeSingle();
    if (jobErr) throw jobErr;
    if (!job || job.status !== "published") {
      return NextResponse.json({ error: "job_not_found" }, { status: 404 });
    }

    const { data: employer, error: empErr } = await admin
      .from("employer_profiles")
      .select("company_name,contact_email")
      .eq("id", job.employer_profile_id)
      .maybeSingle();
    if (empErr) throw empErr;
    const toEmail = (employer?.contact_email ?? "").toString().trim();
    if (!toEmail) return NextResponse.json({ error: "missing_employer_email" }, { status: 400 });

    const { score, breakdown } = calculateJobMatch(
      {
        profile_title: seeker.profile_title ?? null,
        full_name: seeker.full_name ?? null,
        location: seeker.location ?? null,
        about: seeker.about ?? null,
        skills: (seeker.skills as string[] | null) ?? null,
        experience_level: seeker.experience_level ?? null,
        preferred_job_types: (seeker.preferred_job_types as string[] | null) ?? null,
        preferred_locations: (seeker.preferred_locations as string[] | null) ?? null,
      },
      (certs ?? []).map((c) => ({
        certificate_name: (c as { certificate_name?: string | null }).certificate_name ?? null,
        certificate_issuer: (c as { certificate_issuer?: string | null }).certificate_issuer ?? null,
      })),
      {
        title: job.title ?? null,
        location: job.location ?? null,
        work_type: job.work_type ?? null,
        job_type: job.job_type ?? null,
        short_summary: job.short_summary ?? null,
        description: job.description ?? null,
        requirements: job.requirements ?? null,
        requirement_lines: (job.requirement_lines as string[] | null) ?? null,
        required_skills: (job.required_skills as string[] | null) ?? null,
        keywords: (job.keywords as string[] | null) ?? null,
        experience_level_required: job.experience_level_required ?? null,
        certificate_requirements: job.certificate_requirements ?? null,
      }
    );

    const shared = {
      seeker: {
        email: (profile?.email ?? user.email ?? "").toString(),
        full_name: seeker.full_name ?? null,
        profile_title: seeker.profile_title ?? null,
        phone: seeker.phone ?? null,
        location: seeker.location ?? null,
        about: seeker.about ?? null,
        skills: seeker.skills ?? null,
        experience_level: seeker.experience_level ?? null,
        preferred_job_types: seeker.preferred_job_types ?? null,
        preferred_locations: seeker.preferred_locations ?? null,
        cv_url: seeker.cv_url ?? null,
      },
      job: {
        id: job.id,
        title: job.title,
        location: job.location,
        work_type: job.work_type,
        job_type: job.job_type,
        short_summary: job.short_summary,
        requirement_lines: job.requirement_lines,
        required_skills: job.required_skills,
        keywords: job.keywords,
        experience_level_required: job.experience_level_required,
        certificate_requirements: job.certificate_requirements,
      },
      employer: {
        company_name: employer?.company_name ?? null,
      },
    };

    const { data: inserted, error: insErr } = await admin
      .from("job_applications")
      .insert({
        job_post_id: job.id,
        seeker_user_id: user.id,
        cover_letter: coverLetter || null,
        consent_to_share: true,
        shared_profile: shared,
        match_score: score,
        match_breakdown: breakdown,
        status: "submitted",
      })
      .select("id,created_at,match_score")
      .single();

    if (insErr) {
      if (insErr.code === "23505") {
        return NextResponse.json({ error: "duplicate_application" }, { status: 409 });
      }
      throw insErr;
    }

    const from = process.env.EMAIL_FROM || "no-reply@kvalifits.ee";
    const subject = `Uus kandideerimine: ${job.title}`;
    const companyName = (employer?.company_name ?? "—").toString();
    const seekerName = (seeker.full_name ?? "—").toString();
    const seekerEmail = (profile?.email ?? user.email ?? "—").toString();
    const seekerPhone = (seeker.phone ?? "—").toString();
    const seekerLocation = (seeker.location ?? "—").toString();
    const seekerCv = (seeker.cv_url ?? "").toString();

    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.5; color: #111;">
        <h2 style="margin: 0 0 12px 0;">Uus kandideerimine</h2>
        <p style="margin: 0 0 10px 0;"><strong>Ettevõte:</strong> ${escapeHtml(companyName)}</p>
        <p style="margin: 0 0 10px 0;"><strong>Kuulutus:</strong> ${escapeHtml(job.title ?? "—")} (${escapeHtml(job.location ?? "—")})</p>
        <p style="margin: 0 0 10px 0;"><strong>Sobivus (MVP skoor):</strong> ${score}%</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 14px 0;" />
        <p style="margin: 0 0 10px 0;"><strong>Kandidaat:</strong> ${escapeHtml(seekerName)}</p>
        <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${escapeHtml(seekerEmail)}</p>
        <p style="margin: 0 0 10px 0;"><strong>Telefon:</strong> ${escapeHtml(seekerPhone)}</p>
        <p style="margin: 0 0 10px 0;"><strong>Asukoht:</strong> ${escapeHtml(seekerLocation)}</p>
        ${
          seekerCv
            ? `<p style="margin: 0 0 10px 0;"><strong>CV:</strong> <a href="${escapeAttr(
                seekerCv
              )}">${escapeHtml(seekerCv)}</a></p>`
            : ""
        }
        ${
          coverLetter?.trim()
            ? `<p style="margin: 14px 0 6px 0;"><strong>Sõnum:</strong></p><pre style="white-space: pre-wrap; background: #fafafa; border: 1px solid #eee; padding: 12px; border-radius: 10px; margin: 0;">${escapeHtml(
                coverLetter.trim()
              )}</pre>`
            : ""
        }
        <p style="margin: 14px 0 0 0; font-size: 12px; color: #666;">
          Kandidaat andis kandideerides nõusoleku jagada oma profiili ja kontaktandmeid.
        </p>
      </div>
    `;

    await sendEmailViaResend({ from, to: toEmail, subject, html });

    return NextResponse.json({
      ok: true,
      id: inserted.id,
      createdAt: inserted.created_at,
      matchScore: inserted.match_score ?? score,
    });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

function escapeHtml(v: string) {
  return v
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(v: string) {
  return escapeHtml(v).replaceAll("`", "&#096;");
}
