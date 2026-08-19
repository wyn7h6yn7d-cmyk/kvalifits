import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { routing } from "../../i18n/routing.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function loadMessages(locale: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(root, "messages", `${locale}.json`), "utf8")) as Record<
    string,
    unknown
  >;
}

function at(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

describe("localization smoke ET / EN / RU", () => {
  it("ships et, en, and ru as routed locales", () => {
    assert.deepEqual([...routing.locales], ["et", "en", "ru"]);
    assert.equal(routing.defaultLocale, "et");
  });

  it("keeps auth and jobs chrome keys in every locale", () => {
    const keys = [
      "auth.login",
      "auth.loginTitle",
      "auth.logout",
      "auth.forgotPassword",
      "auth.forgotPasswordTitle",
      "auth.resetPasswordTitle",
      "auth.resendVerificationCta",
      "auth.accessBlockedTitle",
      "auth.roleSeeker",
      "auth.roleEmployer",
      "pages.jobs.title",
      "nav.jobs",
      "nav.home",
      "errors.title",
      "errors.body",
      "errors.retry",
      "errors.notFoundTitle",
      "errors.notFoundBody",
      "errors.notFoundHome",
      "metadata.notFoundTitle",
      "metadata.companyMissingTitle",
      "metadata.jobMissingTitle",
      "jobs.applyProfileRequired",
      "jobs.applyCompleteProfile",
      "jobs.saveDraft",
      "jobs.previewJob",
      "jobs.duplicateJob",
      "jobs.publishNow",
      "jobs.previewBanner",
      "jobs.jobDetailSectionDescription",
      "jobs.jobSectionDuties",
      "jobs.jobSectionBenefits",
      "nav.seekerNotifications",
      "nav.seekerJobAlerts",
      "notifications.title",
      "savedSearches.title",
      "savedSearches.savedOkDelivery",
      "savedSearches.emailSubject",
      "notifications.body_saved_search_alert",
      "education.title",
      "education.add",
      "education.edit",
      "education.delete",
      "education.hint",
      "jobs.applicantDetailEducation",
      "employerCandidates.pagePrev",
      "employerCandidates.pageNext",
      "employerCandidates.pageStatus",
      "admin.navAudit",
      "admin.auditTitle",
      "admin.auditEmpty",
      "admin.auditFilterApply",
      "admin.auditPageStatus",
    ];
    for (const locale of routing.locales) {
      const messages = loadMessages(locale);
      for (const key of keys) {
        const value = at(messages, key);
        assert.equal(typeof value, "string", `${locale} missing ${key}`);
        assert.ok(String(value).trim().length > 0, `${locale} empty ${key}`);
      }
    }
  });

  it("uses distinct copy for login and jobs titles across locales", () => {
    const et = loadMessages("et");
    const en = loadMessages("en");
    const ru = loadMessages("ru");
    assert.notEqual(at(et, "auth.loginTitle"), at(en, "auth.loginTitle"));
    assert.notEqual(at(en, "auth.loginTitle"), at(ru, "auth.loginTitle"));
    assert.notEqual(at(et, "pages.jobs.title"), at(en, "pages.jobs.title"));
    assert.notEqual(at(et, "metadata.companyMissingTitle"), at(en, "metadata.companyMissingTitle"));
    assert.notEqual(at(et, "metadata.jobMissingTitle"), at(en, "metadata.jobMissingTitle"));
    assert.notEqual(at(en, "errors.notFoundTitle"), at(ru, "errors.notFoundTitle"));
    assert.notEqual(at(et, "education.title"), at(en, "education.title"));
    assert.notEqual(at(en, "education.title"), at(ru, "education.title"));
    assert.notEqual(at(et, "admin.auditTitle"), at(en, "admin.auditTitle"));
    assert.notEqual(at(en, "admin.auditTitle"), at(ru, "admin.auditTitle"));
  });
});
