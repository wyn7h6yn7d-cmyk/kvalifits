import { getTranslations } from "next-intl/server";

type Props = {
  locale: string;
};

/** Employer-only notice — never includes guardian PII or consent status details. */
export async function EmployerLegalRepresentativeConsentNotice({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "jobs" });
  return (
    <div className="rounded-3xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm leading-relaxed text-amber-800 sm:px-5 sm:py-4">
      {t("employerLegalRepresentativeConsentNotice")}
    </div>
  );
}
