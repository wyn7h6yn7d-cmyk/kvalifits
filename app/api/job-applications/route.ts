import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmailViaResend } from "@/lib/email/resend";

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

    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("role,email")
      .eq("id", user.id)
      .maybeSingle();
    if (profileErr) throw profileErr;
    if (!profile || profile.role !== "seeker") return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const { data: seeker, error: seekerErr } = await admin
      .from("seeker_profiles")
      .select("full_name,phone,location,about,skills,experience_level,preferred_job_types,preferred_locations,cv_url")
      .eq("id", user.id)
      .maybeSingle();
    if (seekerErr) throw seekerErr;

    const { data: job, error: jobErr } = await admin
      .from("job_posts")
      .select("id,title,location,work_type,job_type,employer_profile_id,status")
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

    const shared = {
      seeker: {
        email: (profile?.email ?? user.email ?? "").toString(),
        ...(seeker ?? {}),
      },
      job: {
        id: job.id,
        title: job.title,
        location: job.location,
        work_type: job.work_type,
        job_type: job.job_type,
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
      })
      .select("id,created_at")
      .single();
    if (insErr) throw insErr;

    const from = process.env.EMAIL_FROM || "no-reply@kvalifits.ee";
    const subject = `Uus kandideerimine: ${job.title}`;
    const companyName = (employer?.company_name ?? "—").toString();
    const seekerName = (seeker?.full_name ?? "—").toString();
    const seekerEmail = (profile?.email ?? user.email ?? "—").toString();
    const seekerPhone = (seeker?.phone ?? "—").toString();
    const seekerLocation = (seeker?.location ?? "—").toString();
    const seekerCv = (seeker?.cv_url ?? "").toString();

    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.5; color: #111;">
        <h2 style="margin: 0 0 12px 0;">Uus kandideerimine</h2>
        <p style="margin: 0 0 10px 0;"><strong>Ettevõte:</strong> ${escapeHtml(companyName)}</p>
        <p style="margin: 0 0 10px 0;"><strong>Kuulutus:</strong> ${escapeHtml(job.title ?? "—")} (${escapeHtml(job.location ?? "—")})</p>
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

    return NextResponse.json({ ok: true, id: inserted.id, createdAt: inserted.created_at });
  } catch (e) {
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

