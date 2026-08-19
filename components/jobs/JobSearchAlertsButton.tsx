"use client";

import { useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useRouter } from "@/i18n/routing";
import { cn, errorMessageFromUnknown } from "@/lib/utils";
import {
  DEFAULT_SAVED_SEARCH_MIN_MATCH,
  SAVED_SEARCH_ALERTS_DELIVERY_ENABLED,
  SAVED_SEARCH_FREQUENCIES,
  SAVED_SEARCH_MATCH_THRESHOLDS,
  defaultSavedSearchName,
  fingerprintSavedSearch,
  normalizeSavedSearchSnapshot,
  parseMinMatchPercent,
  parseSavedSearchFrequency,
  type SavedSearchFrequency,
  type SavedSearchSnapshot,
} from "@/lib/jobs/savedJobSearches";

type Props = {
  className?: string;
  snapshot: SavedSearchSnapshot;
  matchSortAvailable: boolean;
  canSave: boolean;
  /** Show even when the seeker is not signed in (empty-state CTA → login). */
  alwaysShow?: boolean;
  label?: string;
  variant?: "outline" | "primary" | "default";
};

export function JobSearchAlertsButton({
  className,
  snapshot,
  matchSortAvailable,
  canSave,
  alwaysShow = false,
  label,
  variant = "outline",
}: Props) {
  const t = useTranslations("jobsSearch");
  const tSaved = useTranslations("savedSearches");
  const locale = useLocale();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<SavedSearchFrequency>("daily");
  const [minMatch, setMinMatch] = useState<string>(
    matchSortAvailable ? String(DEFAULT_SAVED_SEARCH_MIN_MATCH) : "none",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  if (!canSave && !alwaysShow) return null;

  function openDialog() {
    setError(null);
    setSavedOk(false);
    setName(defaultSavedSearchName(snapshot, tSaved("untitled")));
    setFrequency("daily");
    setMinMatch(matchSortAvailable ? String(DEFAULT_SAVED_SEARCH_MIN_MATCH) : "none");
    setOpen(true);
  }

  async function onCtaClick() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }
    openDialog();
  }

  async function onSubmit() {
    setBusy(true);
    setError(null);
    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const normalized = normalizeSavedSearchSnapshot(snapshot);
      const threshold = matchSortAvailable ? parseMinMatchPercent(minMatch) : null;
      const fingerprint = fingerprintSavedSearch(normalized, threshold);
      const label = name.trim().slice(0, 120) || defaultSavedSearchName(normalized, tSaved("untitled"));
      const now = new Date().toISOString();

      const payload = {
        seeker_user_id: user.id,
        name: label,
        query: normalized.query,
        filters: normalized.filters,
        require_public_salary: normalized.requirePublicSalary,
        min_match_percent: threshold,
        frequency,
        enabled: true,
        locale: locale === "en" || locale === "ru" ? locale : "et",
        search_fingerprint: fingerprint,
        updated_at: now,
      };

      const { error: upsertErr } = await supabase.from("saved_job_searches").upsert(payload, {
        onConflict: "seeker_user_id,search_fingerprint",
      });
      if (upsertErr) throw upsertErr;
      setSavedOk(true);
    } catch (e) {
      setError(errorMessageFromUnknown(e, tSaved("saveFailed")));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        className={cn(
          "h-11 gap-2 rounded-xl px-3 text-[13px] lg:h-10",
          variant === "outline" && "border-white/[0.12] bg-white/[0.03]",
          className,
        )}
        onClick={onCtaClick}
      >
        <Bell className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
        <span className="min-w-0 max-lg:whitespace-normal lg:max-w-[12.5rem] lg:truncate">{label ?? t("alertsCta")}</span>
      </Button>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-black/70" />
          <DialogPrimitive.Content
            className="fixed inset-x-0 bottom-0 z-[90] max-h-[min(90dvh,36rem)] w-full overflow-y-auto rounded-t-2xl border border-white/[0.10] bg-[#121214] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[min(90dvh,36rem)] sm:w-[min(28rem,calc(100vw-1.5rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:pb-5"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <DialogPrimitive.Title className="text-[16px] font-semibold text-white/92">
              {tSaved("dialogTitle")}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-2 text-sm leading-relaxed text-white/55">
              {SAVED_SEARCH_ALERTS_DELIVERY_ENABLED ? tSaved("dialogBodyLive") : tSaved("dialogBodyPending")}
            </DialogPrimitive.Description>

            {savedOk ? (
              <div className="mt-5 space-y-4">
                <p className="rounded-xl border border-white/[0.10] bg-white/[0.04] px-3 py-2.5 text-sm text-white/75">
                  {tSaved(SAVED_SEARCH_ALERTS_DELIVERY_ENABLED ? "savedOkDelivery" : "savedPendingDelivery")}
                </p>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => router.push("/account/seeker/alerts")}>
                    {tSaved("manageCta")}
                  </Button>
                  <Button type="button" size="sm" onClick={() => setOpen(false)}>
                    {tSaved("close")}
                  </Button>
                </div>
              </div>
            ) : (
              <form
                className="mt-5 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void onSubmit();
                }}
              >
                <label className="block">
                  <span className="text-[12px] font-medium text-white/55">{tSaved("nameLabel")}</span>
                  <Input
                    className="mt-1.5 h-10 rounded-xl"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={120}
                    autoComplete="off"
                  />
                </label>

                <fieldset className="block">
                  <legend className="text-[12px] font-medium text-white/55">{tSaved("frequencyLabel")}</legend>
                  <div className="mt-2 grid gap-1.5">
                    {SAVED_SEARCH_FREQUENCIES.map((freq) => (
                      <label
                        key={freq}
                        className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/80"
                      >
                        <input
                          type="radio"
                          name="saved-search-frequency"
                          checked={frequency === freq}
                          onChange={() => setFrequency(parseSavedSearchFrequency(freq))}
                          className="accent-white"
                        />
                        {tSaved(`frequency.${freq}`)}
                      </label>
                    ))}
                  </div>
                </fieldset>

                {matchSortAvailable ? (
                  <label className="block">
                    <span className="text-[12px] font-medium text-white/55">{tSaved("minMatchLabel")}</span>
                    <select
                      value={minMatch}
                      onChange={(e) => setMinMatch(e.target.value)}
                      className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.10] bg-white/[0.04] px-3 text-[13px] text-white/85 outline-none focus:border-white/[0.18]"
                    >
                      <option value="none">{tSaved("minMatchNone")}</option>
                      {SAVED_SEARCH_MATCH_THRESHOLDS.map((n) => (
                        <option key={n} value={String(n)}>
                          {tSaved("minMatchOption", { threshold: n })}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                {error ? (
                  <p className="rounded-xl border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-sm text-white/75">
                    {error}
                  </p>
                ) : null}

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                    {tSaved("cancel")}
                  </Button>
                  <Button type="submit" size="sm" loading={busy}>
                    {tSaved("save")}
                  </Button>
                </div>
              </form>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
