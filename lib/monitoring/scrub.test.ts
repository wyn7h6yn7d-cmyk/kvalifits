import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isSensitiveKey, redactQueryString, scrubSentryEvent, scrubValue } from "./scrub.ts";

describe("monitoring scrub", () => {
  it("treats secret, health, CV, and contact keys as sensitive", () => {
    for (const key of [
      "password",
      "access_token",
      "Authorization",
      "cookie",
      "cv",
      "cv_url",
      "resume",
      "certificate_image_url",
      "work_capacity",
      "health",
      "cover_letter",
      "noteForEmployer",
      "application_answers",
      "email",
      "phone",
      "date_of_birth",
      "html",
      "apikey",
      "service_role",
    ]) {
      assert.equal(isSensitiveKey(key), true, key);
    }
    assert.equal(isSensitiveKey("applicationId"), false);
    assert.equal(isSensitiveKey("area"), false);
    assert.equal(isSensitiveKey("code"), false);
  });

  it("replaces nested sensitive values without dropping ids", () => {
    const scrubbed = scrubValue({
      applicationId: "app-1",
      email: "seeker@example.ee",
      application_answers: { noteForEmployer: "private note", salaryMode: "range" },
      nested: { password: "secret", ok: true },
    }) as Record<string, unknown>;
    assert.equal(scrubbed.applicationId, "app-1");
    assert.equal(scrubbed.email, "[Filtered]");
    assert.equal(scrubbed.application_answers, "[Filtered]");
    const nested = scrubbed.nested as Record<string, unknown>;
    assert.equal(nested.password, "[Filtered]");
    assert.equal(nested.ok, true);
  });

  it("strips tokens from query strings", () => {
    assert.equal(
      redactQueryString("access_token=abc&job=1"),
      "access_token=%5BFiltered%5D&job=1",
    );
  });

  it("drops cookies, bodies, emails, and auth headers from events", () => {
    const event = scrubSentryEvent({
      user: { id: "user-1", email: "seeker@example.ee", ip_address: "1.2.3.4", username: "seeker" },
      request: {
        url: "https://kvalifits.ee/api/auth/callback?code=secret-code",
        cookies: { "sb-access-token": "jwt" },
        data: { password: "hunter2", cover_letter: "cv text" },
        headers: { Authorization: "Bearer jwt", "Content-Type": "application/json" },
        query_string: "code=secret-code",
      },
      extra: { html: "<p>email body</p>", applicationId: "app-1" },
      breadcrumbs: [{ data: { cv_url: "user/file.pdf", path: "/et/tood" } }],
    });

    assert.deepEqual(event.user, { id: "user-1" });
    assert.equal(event.request?.cookies, undefined);
    assert.equal(event.request?.data, undefined);
    assert.equal(event.request?.headers?.Authorization, "[Filtered]");
    assert.equal(event.request?.headers?.["Content-Type"], "application/json");
    assert.equal(event.extra?.html, "[Filtered]");
    assert.equal(event.extra?.applicationId, "app-1");
    assert.equal(event.breadcrumbs?.[0]?.data?.cv_url, "[Filtered]");
    assert.ok(String(event.request?.url ?? "").includes("code=%5BFiltered%5D"));
  });
});
