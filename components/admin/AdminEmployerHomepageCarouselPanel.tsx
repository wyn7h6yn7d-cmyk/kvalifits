"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { resolveCarouselLogoPublicUrl } from "@/lib/employer/carouselLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { errorMessageFromUnknown } from "@/lib/utils";

export type AdminEmployerHomepageCarouselRow = {
  id: string;
  owner_user_id: string;
  logo_url?: string | null;
  show_on_homepage?: boolean | null;
  homepage_logo_approved?: boolean | null;
  carousel_logo_path?: string | null;
  use_logo_plate?: boolean | null;
};

type Props = {
  companyName: string;
  employer: AdminEmployerHomepageCarouselRow;
  disabled?: boolean;
};

type LuminanceHint = "good" | "needs_plate" | "unknown";

function useAverageLogoLuminance(src: string | null): LuminanceHint {
  const [analyzed, setAnalyzed] = useState<{ src: string; hint: LuminanceHint } | null>(null);

  useEffect(() => {
    if (!src) return;

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        const size = 72;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setAnalyzed({ src, hint: "unknown" });
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        let sum = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          if ((data[i + 3] ?? 0) < 40) continue;
          const r = data[i] ?? 0;
          const g = data[i + 1] ?? 0;
          const b = data[i + 2] ?? 0;
          sum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
          count++;
        }
        if (!count) {
          setAnalyzed({ src, hint: "unknown" });
          return;
        }
        const avg = sum / count;
        setAnalyzed({
          src,
          hint: avg >= 198 ? "needs_plate" : avg <= 155 ? "good" : "unknown",
        });
      } catch {
        setAnalyzed({ src, hint: "unknown" });
      }
    };
    img.onerror = () => {
      if (!cancelled) setAnalyzed({ src, hint: "unknown" });
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!src) return "unknown";
  if (!analyzed || analyzed.src !== src) return "unknown";
  return analyzed.hint;
}

function DarkLogoPreview({
  label,
  src,
  plate = false,
  emptyLabel,
}: {
  label: string;
  src: string | null;
  plate?: boolean;
  emptyLabel: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-3">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-2">{label}</div>
      <div className="mt-2 flex h-24 items-center justify-center rounded-lg border border-border bg-background px-3">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className={cn(
              "max-h-14 w-auto max-w-full object-contain",
              plate && "rounded-md bg-[#f8fafc] px-3 py-2",
            )}
          />
        ) : (
          <span className="text-xs text-muted-2">{emptyLabel}</span>
        )}
      </div>
    </div>
  );
}

export function AdminEmployerHomepageCarouselPanel({ companyName, employer, disabled = false }: Props) {
  const t = useTranslations("admin");
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const originalUrl = (employer.logo_url ?? "").toString().trim() || null;
  const carouselUrl = resolveCarouselLogoPublicUrl(employer.carousel_logo_path);
  const hasOriginalLogo = Boolean(originalUrl);
  const hasCarouselAsset = Boolean((employer.carousel_logo_path ?? "").toString().trim());
  const isApproved = Boolean(employer.homepage_logo_approved);
  const isVisible = Boolean(employer.show_on_homepage);
  const usePlate = Boolean(employer.use_logo_plate);

  const reviewUrl = carouselUrl ?? originalUrl;
  const luminanceHint = useAverageLogoLuminance(reviewUrl);
  const canApprove = hasOriginalLogo && hasCarouselAsset;

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/employers/homepage-carousel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employerId: employer.id, ...body }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        if (json.error === "mfa_required") throw new Error(t("deleteUserErrMfa"));
        if (json.error === "missing_service_role_key") throw new Error(t("deleteUserErrConfig"));
        throw new Error(json.message || t("unknownError"));
      }
      router.refresh();
    } catch (err) {
      setError(errorMessageFromUnknown(err, t("unknownError")));
    } finally {
      setBusy(false);
    }
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("employerId", employer.id);
      form.set("ownerUserId", employer.owner_user_id);
      form.set("file", file);
      const res = await fetch("/api/admin/employers/homepage-carousel", {
        method: "POST",
        body: form,
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        if (json.error === "mfa_required") throw new Error(t("deleteUserErrMfa"));
        if (json.error === "missing_service_role_key") throw new Error(t("deleteUserErrConfig"));
        throw new Error(json.message || t("unknownError"));
      }
      router.refresh();
    } catch (err) {
      setError(errorMessageFromUnknown(err, t("unknownError")));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (disabled) return null;

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-border bg-white px-3 py-4 sm:px-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-2">
            {t("homepageCarouselReviewEyebrow")}
          </div>
          <div className="mt-1 text-sm font-semibold text-foreground">{companyName}</div>
          <p className="mt-1 text-xs leading-relaxed text-muted-2">{t("homepageCarouselHint")}</p>
        </div>
        <div
          className={cn(
            "inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium",
            luminanceHint === "good" && "border-emerald-400/25 bg-emerald-500/10 text-emerald-800",
            luminanceHint === "needs_plate" && "border-amber-400/25 bg-amber-500/10 text-amber-50",
            luminanceHint === "unknown" && "border-border bg-[#f8fafc] text-muted-2",
          )}
        >
          {luminanceHint === "good"
            ? t("homepageCarouselDarkBgGood")
            : luminanceHint === "needs_plate"
              ? t("homepageCarouselDarkBgNeedsPlate")
              : t("homepageCarouselDarkBgReview")}
        </div>
      </div>

      {error ? <p className="text-xs text-red-200/90">{error}</p> : null}

      {!hasCarouselAsset ? (
        <p className="rounded-xl border border-amber-400/20 bg-amber-500/[0.08] px-3 py-2 text-xs leading-relaxed text-amber-50/90">
          {t("homepageCarouselMissingProcessed")}
        </p>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-3">
        <DarkLogoPreview
          label={t("homepageCarouselOriginalLogo")}
          src={originalUrl}
          emptyLabel={t("showOnHomepageNoLogo")}
        />
        <DarkLogoPreview
          label={t("homepageCarouselProcessedLogo")}
          src={carouselUrl}
          emptyLabel={t("homepageCarouselNoProcessedLogo")}
        />
        <DarkLogoPreview
          label={t("homepageCarouselSitePreview")}
          src={carouselUrl ?? (usePlate ? originalUrl : null)}
          plate={usePlate}
          emptyLabel={t("homepageCarouselNoSitePreview")}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={isApproved ? "outline" : "primary"}
          size="sm"
          className="h-9 rounded-xl px-3 text-[13px]"
          disabled={busy || isApproved || !canApprove}
          onClick={() => void patch({ homepageLogoApproved: true })}
        >
          {t("homepageCarouselApprove")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 rounded-xl px-3 text-[13px]"
          disabled={busy || !isApproved}
          onClick={() => void patch({ homepageLogoApproved: false, showOnHomepage: false })}
        >
          {t("homepageCarouselRevokeApproval")}
        </Button>
        <Button
          type="button"
          variant={isVisible ? "outline" : "primary"}
          size="sm"
          className="h-9 rounded-xl px-3 text-[13px]"
          disabled={busy || isVisible || !isApproved}
          onClick={() => void patch({ showOnHomepage: true })}
        >
          {t("homepageCarouselShow")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 rounded-xl px-3 text-[13px]"
          disabled={busy || !isVisible}
          onClick={() => void patch({ showOnHomepage: false })}
        >
          {t("homepageCarouselHide")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
        <Button
          type="button"
          variant={usePlate ? "primary" : "outline"}
          size="sm"
          className="h-9 rounded-xl px-3 text-[13px]"
          disabled={busy || !hasOriginalLogo}
          onClick={() => void patch({ useOriginalOnPlate: true })}
        >
          {t("homepageCarouselUseOriginalPlate")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 rounded-xl px-3 text-[13px]"
          disabled={busy || !hasCarouselAsset}
          onClick={() => void patch({ useLogoPlate: !usePlate })}
        >
          {usePlate ? t("homepageCarouselPlateOff") : t("homepageCarouselPlateOn")}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(ev) => void onUpload(ev.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 rounded-xl px-3 text-[13px]"
          disabled={busy || !hasOriginalLogo}
          onClick={() => fileRef.current?.click()}
        >
          {t("homepageCarouselUpload")}
        </Button>
        {hasCarouselAsset ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 rounded-xl px-3 text-[13px] text-muted"
            disabled={busy}
            onClick={() => void patch({ clearCarouselLogo: true, homepageLogoApproved: false, showOnHomepage: false })}
          >
            {t("homepageCarouselRemove")}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 text-[11px] text-muted-2">
        {isApproved ? (
          <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-emerald-800">
            {t("homepageCarouselStatusApproved")}
          </span>
        ) : (
          <span className="rounded-full border border-border px-2 py-0.5">{t("homepageCarouselStatusPending")}</span>
        )}
        {isVisible ? (
          <span className="rounded-full border border-[rgba(37,99,235,0.18)] bg-[rgba(37,99,235,0.07)] px-2 py-0.5 text-primary">
            {t("homepageCarouselStatusVisible")}
          </span>
        ) : (
          <span className="rounded-full border border-border px-2 py-0.5">{t("homepageCarouselStatusHidden")}</span>
        )}
        {usePlate ? (
          <span className="rounded-full border border-border bg-[#f8fafc] px-2 py-0.5">
            {t("homepageCarouselStatusPlate")}
          </span>
        ) : null}
      </div>
    </div>
  );
}
