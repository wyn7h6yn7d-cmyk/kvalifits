"use client";

import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import {
  LEARNING_OBLIGATION_VALUES,
  LEGAL_REPRESENTATIVE_CONSENT_SEEKER_EDITABLE,
  calculateAgeYears,
  needsLearningObligationStatus,
  type LearningObligationStatus,
  type LegalRepresentativeConsentStatus,
} from "@/lib/seeker/age";

type Props = {
  dateOfBirth: string;
  learningObligationStatus: LearningObligationStatus | "";
  legalRepresentativeConsentStatus: LegalRepresentativeConsentStatus | "";
  onDateOfBirthChange: (value: string) => void;
  onLearningObligationChange: (value: LearningObligationStatus | "") => void;
  onLegalRepresentativeConsentChange: (value: LegalRepresentativeConsentStatus | "") => void;
};

export function SeekerBirthDateFields({
  dateOfBirth,
  learningObligationStatus,
  legalRepresentativeConsentStatus,
  onDateOfBirthChange,
  onLearningObligationChange,
  onLegalRepresentativeConsentChange,
}: Props) {
  const t = useTranslations("onboarding");
  const ageYears = dateOfBirth ? calculateAgeYears(dateOfBirth) : null;
  const showLearning = needsLearningObligationStatus(ageYears);
  const isMinor = ageYears !== null && ageYears < 18;
  const consentConfirmed = legalRepresentativeConsentStatus === "confirmed";
  const consentSelectValue =
    legalRepresentativeConsentStatus === "pending"
      ? "pending"
      : legalRepresentativeConsentStatus === "confirmed"
        ? "confirmed"
        : "required";

  return (
    <div className="rounded-3xl border border-border bg-[#f8fafc] p-5 sm:p-6 space-y-4">
      <div>
        <div className="text-sm font-medium text-foreground/80">{t("birthDateSectionTitle")}</div>
        <div className="mt-1 text-sm leading-relaxed text-muted">{t("birthDateSectionHint")}</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground" htmlFor="seeker-date-of-birth">
            {t("dateOfBirth")}
          </label>
          <Input
            id="seeker-date-of-birth"
            type="date"
            value={dateOfBirth}
            onChange={(e) => {
              const next = e.target.value;
              onDateOfBirthChange(next);
              const nextAge = next ? calculateAgeYears(next) : null;
              if (!needsLearningObligationStatus(nextAge) && learningObligationStatus) {
                onLearningObligationChange("");
              }
              if (nextAge === null || nextAge >= 18) {
                onLegalRepresentativeConsentChange("");
              } else if (!legalRepresentativeConsentStatus) {
                onLegalRepresentativeConsentChange("required");
              }
            }}
            required
            max={new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div className="space-y-2">
          <div className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("calculatedAge")}</div>
          <div className="flex h-11 items-center rounded-2xl border border-border bg-[#f8fafc] px-4 text-sm text-muted">
            {ageYears === null ? t("calculatedAgeEmpty") : t("calculatedAgeValue", { age: ageYears })}
          </div>
        </div>
      </div>

      {isMinor ? (
        <div className="rounded-2xl border border-border bg-white px-4 py-3 text-sm leading-relaxed text-muted">
          {t("minorStatusNotice")}
        </div>
      ) : null}

      {showLearning ? (
        <div className="space-y-2">
          <label
            className="text-[0.9375rem] font-medium leading-snug text-foreground"
            htmlFor="seeker-learning-obligation"
          >
            {t("learningObligation")}
          </label>
          <select
            id="seeker-learning-obligation"
            value={learningObligationStatus}
            onChange={(e) =>
              onLearningObligationChange(e.target.value as LearningObligationStatus | "")
            }
            required
            className="h-11 w-full rounded-2xl border border-border bg-[#f8fafc] px-4 text-sm text-foreground/80 outline-none transition-colors focus:border-[rgba(37,99,235,0.35)] focus:bg-[#f8fafc]"
          >
            <option value="">{t("learningObligationPlaceholder")}</option>
            {LEARNING_OBLIGATION_VALUES.map((v) => (
              <option key={v} value={v}>
                {t(`learningObligationOption.${v}`)}
              </option>
            ))}
          </select>
          <div className="text-xs text-muted-2">{t("learningObligationHint")}</div>
        </div>
      ) : null}

      {isMinor ? (
        <div className="space-y-3 rounded-2xl border border-border bg-white p-4">
          <div>
            <div className="text-sm font-medium text-foreground/80">{t("legalRepresentativeConsentTitle")}</div>
            <div className="mt-1 text-xs leading-relaxed text-muted-2">{t("legalRepresentativeConsentDisclaimer")}</div>
          </div>
          <div className="space-y-2">
            <label
              className="text-[0.9375rem] font-medium leading-snug text-foreground"
              htmlFor="seeker-legal-rep-consent"
            >
              {t("legalRepresentativeConsentStatus")}
            </label>
            {consentConfirmed ? (
              <div className="flex h-11 items-center rounded-2xl border border-border bg-[#f8fafc] px-4 text-sm text-muted">
                {t("legalRepresentativeConsentOption.confirmed")}
              </div>
            ) : (
              <select
                id="seeker-legal-rep-consent"
                value={consentSelectValue}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "pending" || v === "required") {
                    onLegalRepresentativeConsentChange(v);
                  }
                }}
                className="h-11 w-full rounded-2xl border border-border bg-[#f8fafc] px-4 text-sm text-foreground/80 outline-none transition-colors focus:border-[rgba(37,99,235,0.35)] focus:bg-[#f8fafc]"
              >
                {LEGAL_REPRESENTATIVE_CONSENT_SEEKER_EDITABLE.map((v) => (
                  <option key={v} value={v}>
                    {t(`legalRepresentativeConsentOption.${v}`)}
                  </option>
                ))}
              </select>
            )}
            <div className="text-xs text-muted-2">{t("legalRepresentativeConsentHint")}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
