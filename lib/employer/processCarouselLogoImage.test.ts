import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { extractAvatarsStoragePathFromLogoUrl, buildProcessedCarouselLogoStoragePath } from "./carouselLogoPaths.ts";
import {
  cornersAgree,
  countTransparentFraction,
  removeFlatBackgroundFromRgba,
  rgbDistance,
} from "./processCarouselLogoImage.ts";

describe("extractAvatarsStoragePathFromLogoUrl", () => {
  it("extracts object key from public avatars URL", () => {
    assert.equal(
      extractAvatarsStoragePathFromLogoUrl(
        "https://proj.supabase.co/storage/v1/object/public/avatars/user-1/employer-logo/1.png",
      ),
      "user-1/employer-logo/1.png",
    );
  });
});

describe("buildProcessedCarouselLogoStoragePath", () => {
  it("uses processed.png under carousel-logo", () => {
    assert.equal(buildProcessedCarouselLogoStoragePath("user-1"), "user-1/carousel-logo/processed.png");
  });
});

describe("removeFlatBackgroundFromRgba", () => {
  it("removes a flat white background", () => {
    const width = 8;
    const height = 8;
    const data = new Uint8Array(width * height * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }
    for (let y = 2; y <= 5; y++) {
      for (let x = 2; x <= 5; x++) {
        const i = (y * width + x) * 4;
        data[i] = 20;
        data[i + 1] = 40;
        data[i + 2] = 180;
        data[i + 3] = 255;
      }
    }

    const result = removeFlatBackgroundFromRgba(data, width, height);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.ok(result.removedFraction > 0.35);
    assert.equal(result.data[0], 255);
    assert.equal(result.data[3], 0);
    assert.equal(result.data[(3 * width + 3) * 4 + 3], 255);
  });

  it("rejects when corners disagree", () => {
    const width = 5;
    const height = 5;
    const data = new Uint8Array(width * height * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }
    const br = (3 * width + 3) * 4;
    data[br] = 0;
    data[br + 1] = 0;
    data[br + 2] = 0;

    const result = removeFlatBackgroundFromRgba(data, width, height);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.reason, "corners_disagree");
  });
});

describe("rgbDistance helpers", () => {
  it("measures channel distance", () => {
    assert.equal(rgbDistance([0, 0, 0], [10, 0, 0]), 10);
    assert.equal(cornersAgree([[250, 250, 250], [248, 252, 250]], 5), true);
  });

  it("counts transparent pixels", () => {
    const data = new Uint8Array([255, 255, 255, 255, 0, 0, 0, 0]);
    assert.equal(countTransparentFraction(data), 0.5);
  });
});
