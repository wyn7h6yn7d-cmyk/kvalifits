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
    <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6 space-y-4">
      <div>
        <div className="text-sm font-medium text-white/85">{t("birthDateSectionTitle")}</div>
        <div className="mt-1 text-sm leading-relaxed text-white/60">{t("birthDateSectionHint")}</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65" htmlFor="seeker-date-of-birth">
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
          <div className="text-xs font-medium tracking-wide text-white/65">{t("calculatedAge")}</div>
          <div className="flex h-11 items-center rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 text-sm text-white/75">
            {ageYears === null ? t("calculatedAgeEmpty") : t("calculatedAgeValue", { age: ageYears })}
          </div>
        </div>
      </div>

      {isMinor ? (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm leading-relaxed text-white/65">
          {t("minorStatusNotice")}
        </div>
      ) : null}

      {showLearning ? (
        <div className="space-y-2">
          <label
            className="text-xs font-medium tracking-wide text-white/65"
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
            className="h-11 w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 text-sm text-white/85 outline-none backdrop-blur-md transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
          >
            <option value="">{t("learningObligationPlaceholder")}</option>
            {LEARNING_OBLIGATION_VALUES.map((v) => (
              <option key={v} value={v}>
                {t(`learningObligationOption.${v}`)}
              </option>
            ))}
          </select>
          <div className="text-xs text-white/45">{t("learningObligationHint")}</div>
        </div>
      ) : null}

      {isMinor ? (
        <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
          <div>
            <div className="text-sm font-medium text-white/85">{t("legalRepresentativeConsentTitle")}</div>
            <div className="mt-1 text-xs leading-relaxed text-white/50">{t("legalRepresentativeConsentDisclaimer")}</div>
          </div>
          <div className="space-y-2">
            <label
              className="text-xs font-medium tracking-wide text-white/65"
              htmlFor="seeker-legal-rep-consent"
            >
              {t("legalRepresentativeConsentStatus")}
            </label>
            {consentConfirmed ? (
              <div className="flex h-11 items-center rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 text-sm text-white/75">
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
                className="h-11 w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 text-sm text-white/85 outline-none backdrop-blur-md transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
              >
                {LEGAL_REPRESENTATIVE_CONSENT_SEEKER_EDITABLE.map((v) => (
                  <option key={v} value={v}>
                    {t(`legalRepresentativeConsentOption.${v}`)}
                  </option>
                ))}
              </select>
            )}
            <div className="text-xs text-white/45">{t("legalRepresentativeConsentHint")}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
