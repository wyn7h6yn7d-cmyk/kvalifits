"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SheetTrigger } from "@/components/ui/sheet";
import { QuickApplySheet, scrollApplyFieldIntoView } from "@/components/jobs/QuickApplySheet";

/** Playwright-only chrome that reuses the production Quick Apply sheet. */
export function QuickApplyA11yHarness() {
  const t = useTranslations("jobs");
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setOpen(false);
  }

  return (
    <QuickApplySheet
      open={open}
      onOpenChange={setOpen}
      title={t("quickApplyTitle")}
      description={t("quickApplySubtitle")}
      closeLabel={t("applySheetClose")}
      trigger={
        <SheetTrigger asChild>
          <Button type="button" variant="primary" size="lg" data-testid="quick-apply-open">
            {t("applyOpenCta")}
          </Button>
        </SheetTrigger>
      }
    >
      <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-4 pt-1 sm:px-5">
          <label className="block space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
              {t("applyNoteLabel")}
            </span>
            <Input
              aria-label={t("applyNoteLabel")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onFocus={scrollApplyFieldIntoView}
            />
          </label>
          <div className="h-[70vh] rounded-xl border border-white/[0.08]" aria-hidden />
        </div>
        <div className="shrink-0 border-t border-white/[0.08] bg-[#121216] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
          <Button type="submit" variant="primary" size="lg" className="h-12 w-full">
            {t("applyCta")}
          </Button>
        </div>
      </form>
    </QuickApplySheet>
  );
}
