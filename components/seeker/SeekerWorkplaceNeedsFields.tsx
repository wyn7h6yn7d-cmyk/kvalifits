"use client";

import { useTranslations } from "next-intl";

import {
  WORKPLACE_NEED_KEYS,
  type WorkplaceNeedKey,
  type WorkplaceNeedsFormValue,
} from "@/lib/seeker/workplaceNeeds";

type Props = {
  value: WorkplaceNeedsFormValue;
  onChange: (next: WorkplaceNeedsFormValue) => void;
};

export function SeekerWorkplaceNeedsFields({ value, onChange }: Props) {
  const t = useTranslations("onboarding");

  function patch(partial: Partial<WorkplaceNeedsFormValue>) {
    onChange({ ...value, ...partial });
  }

  function setNeed(key: WorkplaceNeedKey, checked: boolean) {
    const nextShared = checked
      ? value.shared_with_employer
      : value.shared_with_employer.filter((k) => k !== key);
    if (key === "other_need") {
      patch({
        other_need: checked,
        other_note: checked ? value.other_note : "",
        shared_with_employer: nextShared,
      });
      return;
    }
    patch({ [key]: checked, shared_with_employer: nextShared } as Partial<WorkplaceNeedsFormValue>);
  }

  function setShare(key: WorkplaceNeedKey, share: boolean) {
    if (!value.share_practical_needs_with_employer) return;
    const selected =
      key === "other_need" ? value.other_need : Boolean(value[key as keyof WorkplaceNeedsFormValue]);
    if (!selected) return;
    const set = new Set(value.shared_with_employer);
    if (share) set.add(key);
    else set.delete(key);
    patch({ shared_with_employer: Array.from(set) });
  }

  return (
    <div className="rounded-3xl border border-border bg-[#f8fafc] p-5 sm:p-6 space-y-4">
      <div>
        <div className="text-sm font-medium text-foreground/80">{t("workplaceNeedsTitle")}</div>
        <div className="mt-1 text-sm leading-relaxed text-muted">{t("workplaceNeedsHint")}</div>
        <div className="mt-2 text-xs leading-relaxed text-muted-2">{t("workplaceNeedsPrivacy")}</div>
        <div className="mt-2 text-xs leading-relaxed text-muted-2">{t("workplaceNeedsNoMedical")}</div>
      </div>

      <label className="flex cursor-pointer select-none items-start gap-3 rounded-2xl border border-border bg-white px-4 py-3">
        <input
          type="checkbox"
          checked={value.share_practical_needs_with_employer}
          onChange={(e) => {
            const on = e.target.checked;
            patch({
              share_practical_needs_with_employer: on,
              shared_with_employer: on ? value.shared_with_employer : [],
            });
          }}
          className="mt-1 h-4 w-4 rounded border-border-strong bg-[#f8fafc]"
        />
        <span>
          <span className="block text-sm font-medium text-foreground/80">
            {t("sharePracticalNeedsWithEmployer")}
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-muted-2">
            {t("sharePracticalNeedsWithEmployerHint")}
          </span>
        </span>
      </label>

      <div className="space-y-3">
        {WORKPLACE_NEED_KEYS.map((key) => {
          const selected =
            key === "other_need" ? value.other_need : Boolean(value[key as keyof WorkplaceNeedsFormValue]);
          const shared =
            value.share_practical_needs_with_employer && value.shared_with_employer.includes(key);
          return (
            <div
              key={key}
              className="rounded-2xl border border-border bg-white px-4 py-3 space-y-2"
            >
              <label className="flex cursor-pointer select-none items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => setNeed(key, e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border-strong bg-[#f8fafc]"
                />
                <span className="text-sm font-medium text-foreground/80">{t(`workplaceNeed.${key}`)}</span>
              </label>

              {selected && value.share_practical_needs_with_employer ? (
                <label className="ml-7 flex cursor-pointer select-none items-start gap-2">
                  <input
                    type="checkbox"
                    checked={shared}
                    onChange={(e) => setShare(key, e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-border-strong bg-[#f8fafc]"
                  />
                  <span className="text-xs leading-relaxed text-muted-2">
                    {t("workplaceNeedShareWithEmployer")}
                  </span>
                </label>
              ) : null}

              {key === "other_need" && selected ? (
                <div className="ml-7 space-y-1.5">
                  <label className="text-[0.9375rem] font-medium leading-snug text-foreground" htmlFor="wn-other-note">
                    {t("workplaceNeedOtherNote")}
                  </label>
                  <textarea
                    id="wn-other-note"
                    value={value.other_note}
                    onChange={(e) => patch({ other_note: e.target.value.slice(0, 500) })}
                    rows={2}
                    maxLength={500}
                    placeholder={t("workplaceNeedOtherNoteHint")}
                    className="w-full rounded-2xl border border-border bg-[#f8fafc] px-4 py-3 text-sm text-foreground/80 placeholder:text-muted-2 outline-none transition-colors focus:border-[rgba(37,99,235,0.35)] focus:bg-[#f8fafc]"
                  />
                  <div className="text-xs text-muted-2">{t("workplaceNeedOtherNoteNoMedical")}</div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
