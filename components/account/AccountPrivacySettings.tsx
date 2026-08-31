"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { ACCOUNT_DELETE_CONFIRM_WORD } from "@/lib/account/privacyCategories";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/routing";

type Props = {
  locale: string;
  className?: string;
};

export function AccountPrivacySettings({ locale, className }: Props) {
  const t = useTranslations("accountPrivacy");
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmWord, setConfirmWord] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function onExport() {
    setExportLoading(true);
    setExportError(null);
    try {
      const res = await fetch("/api/account/export", { method: "GET" });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        if (json.error === "not_authenticated") {
          setExportError(t("errNotAuthed"));
        } else {
          setExportError(t("errExport"));
        }
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = /filename="([^"]+)"/.exec(disposition);
      const filename = match?.[1] ?? "kvalifits-andmed.json";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setExportError(t("errExport"));
    } finally {
      setExportLoading(false);
    }
  }

  async function onDelete() {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmWord: confirmWord.trim(),
          acknowledged,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        if (json.error === "confirm_word_required") {
          setDeleteError(t("errConfirmWord", { word: ACCOUNT_DELETE_CONFIRM_WORD }));
        } else if (json.error === "acknowledgement_required") {
          setDeleteError(t("errAcknowledge"));
        } else if (json.error === "missing_service_role_key") {
          setDeleteError(t("errServerConfig"));
        } else if (json.error === "missing_privacy_tables") {
          setDeleteError(t("errMissingTables"));
        } else if (json.error === "admin_cannot_self_delete") {
          setDeleteError(t("errAdmin"));
        } else if (json.error === "not_authenticated") {
          setDeleteError(t("errNotAuthed"));
        } else {
          setDeleteError(t("errDelete"));
        }
        return;
      }
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
      router.replace(`/${locale}/auth/login`);
      router.refresh();
    } catch {
      setDeleteError(t("errDelete"));
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className={className}>
      <div className="rounded-3xl border border-border bg-[#f8fafc] p-5 sm:p-6">
        <div className="text-sm font-medium text-foreground/80">{t("title")}</div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-2">{t("subtitle")}</p>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-2">
          {t.rich("legalHint", {
            rights: (chunks) => (
              <Link href="/andmekaitse" className="underline-offset-2 hover:underline">
                {chunks}
              </Link>
            ),
          })}
        </p>

        <div className="mt-5 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm text-foreground/80">{t("downloadTitle")}</div>
              <div className="mt-0.5 text-xs text-muted-2">{t("downloadHint")}</div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 shrink-0 rounded-xl px-3 text-[13px]"
              loading={exportLoading}
              loadingText={t("downloadLoading")}
              onClick={() => void onExport()}
            >
              {t("downloadCta")}
            </Button>
          </div>
          {exportError ? (
            <p className="text-xs text-rose-200/90">{exportError}</p>
          ) : null}

          <div className="border-t border-border pt-4">
            <div className="text-sm text-foreground/80">{t("deleteTitle")}</div>
            <div className="mt-0.5 text-xs leading-relaxed text-muted-2">{t("deleteHint")}</div>
            {!deleteOpen ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 h-9 rounded-xl px-3 text-[13px] text-rose-800"
                onClick={() => {
                  setDeleteOpen(true);
                  setDeleteError(null);
                  setConfirmWord("");
                  setAcknowledged(false);
                }}
              >
                {t("deleteOpenCta")}
              </Button>
            ) : (
              <div className="mt-4 space-y-3 rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] p-4">
                <p className="text-xs leading-relaxed text-body">{t("deleteConfirmIntro")}</p>
                <label className="flex items-start gap-2.5 text-xs leading-relaxed text-body">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border-strong bg-[#f8fafc]"
                  />
                  <span>{t("deleteAcknowledge")}</span>
                </label>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium tracking-wide text-muted-2" htmlFor="delete-confirm-word">
                    {t("deleteTypeWord", { word: ACCOUNT_DELETE_CONFIRM_WORD })}
                  </label>
                  <Input
                    id="delete-confirm-word"
                    value={confirmWord}
                    onChange={(e) => setConfirmWord(e.target.value)}
                    autoComplete="off"
                    placeholder={ACCOUNT_DELETE_CONFIRM_WORD}
                  />
                </div>
                {deleteError ? (
                  <p className="whitespace-pre-wrap text-xs text-rose-200/90">{deleteError}</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-xl px-3 text-[13px]"
                    disabled={deleteLoading}
                    onClick={() => setDeleteOpen(false)}
                  >
                    {t("deleteCancel")}
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="h-9 rounded-xl px-3 text-[13px]"
                    disabled={
                      deleteLoading ||
                      !acknowledged ||
                      confirmWord.trim().toUpperCase() !== ACCOUNT_DELETE_CONFIRM_WORD
                    }
                    loading={deleteLoading}
                    loadingText={t("deleteLoading")}
                    onClick={() => void onDelete()}
                  >
                    {t("deleteConfirmCta")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
