import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  RESUMES_BUCKET,
  buildCvObjectPath,
  firstCvStorageRef,
  hasCvStorageRef,
  parseCvStorageRef,
  persistCvStorageRef,
} from "./cvStorage.ts";

const UID = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

describe("private CV storage refs", () => {
  it("owner path is a private resumes object, not a public URL", () => {
    const path = `${UID}/cv/1710000000-cv.pdf`;
    const ref = parseCvStorageRef(path);
    assert.ok(ref);
    assert.equal(ref.bucket, RESUMES_BUCKET);
    assert.equal(ref.path, path);
    assert.equal(ref.ownerUserId, UID);
    assert.equal(ref.legacyPublicAvatars, false);
    assert.equal(persistCvStorageRef(path), path);
    assert.equal(hasCvStorageRef(path), true);
  });

  it("legacy public avatars CV URL becomes an object path", () => {
    const url = `https://xyz.supabase.co/storage/v1/object/public/avatars/${UID}/cv/old-cv.pdf`;
    const ref = parseCvStorageRef(url);
    assert.ok(ref);
    assert.equal(ref.path, `${UID}/cv/old-cv.pdf`);
    assert.equal(ref.legacyPublicAvatars, true);
    assert.equal(persistCvStorageRef(url), `${UID}/cv/old-cv.pdf`);
    assert.equal(persistCvStorageRef(url)?.startsWith("http"), false);
  });

  it("rejects public avatar photos and other seekers as CV refs", () => {
    assert.equal(parseCvStorageRef(`https://x/storage/v1/object/public/avatars/${UID}/avatar-1.jpg`), null);
    assert.equal(parseCvStorageRef(`${UID}/avatar-1.jpg`), null);
    assert.equal(parseCvStorageRef("https://evil.example/cv.pdf"), null);
    assert.equal(persistCvStorageRef(`https://x/storage/v1/object/public/avatars/${UID}/avatar-1.jpg`), null);
  });

  it("buildCvObjectPath stays under the owner cv prefix", () => {
    const path = buildCvObjectPath(UID, "My Resume (final).PDF");
    assert.match(path, new RegExp(`^${UID}/cv/\\d+-my-resume-final\\.pdf$`));
    const ref = parseCvStorageRef(path);
    assert.ok(ref);
    assert.equal(ref.ownerUserId, UID);
    assert.notEqual(ref.ownerUserId, OTHER);
  });

  it("firstCvStorageRef prefers a valid private path", () => {
    const path = `${UID}/cv/file.pdf`;
    assert.equal(firstCvStorageRef(null, "not-a-cv", path), path);
    assert.equal(firstCvStorageRef(`https://x/storage/v1/object/public/avatars/${UID}/cv/file.pdf`), path);
  });
});
