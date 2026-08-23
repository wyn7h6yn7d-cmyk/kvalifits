import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  mapHomepageShowcaseRow,
  resolveHomepageShowcaseLogo,
} from "./homepageShowcase.ts";
import {
  buildCarouselLogoStoragePath,
  isCarouselLogoStoragePath,
  isEmployerOriginalLogoStoragePath,
  resolveCarouselLogoPublicUrl,
} from "../employer/carouselLogo.ts";

describe("resolveCarouselLogoPublicUrl", () => {
  it("resolves storage key against origin", () => {
    assert.equal(
      resolveCarouselLogoPublicUrl("user-1/carousel-logo/approved.png", "https://proj.supabase.co"),
      "https://proj.supabase.co/storage/v1/object/public/avatars/user-1/carousel-logo/approved.png",
    );
  });

  it("passes through absolute URLs", () => {
    assert.equal(
      resolveCarouselLogoPublicUrl("https://cdn.example/logo.png", "https://proj.supabase.co"),
      "https://cdn.example/logo.png",
    );
  });
});

describe("carousel logo paths", () => {
  it("detects employer original logo folder", () => {
    assert.equal(isEmployerOriginalLogoStoragePath("abc/employer-logo/1.png"), true);
    assert.equal(isEmployerOriginalLogoStoragePath("abc/carousel-logo/approved.png"), false);
  });

  it("detects carousel logo folder", () => {
    assert.equal(isCarouselLogoStoragePath("abc/carousel-logo/approved.png"), true);
  });

  it("builds carousel storage path", () => {
    assert.equal(buildCarouselLogoStoragePath("abc", "PNG"), "abc/carousel-logo/approved.png");
  });
});

describe("resolveHomepageShowcaseLogo", () => {
  it("uses transparent carousel asset when plate is off", () => {
    assert.deepEqual(
      resolveHomepageShowcaseLogo({
        carousel_logo_path:
          "https://proj.supabase.co/storage/v1/object/public/avatars/user-1/carousel-logo/processed.png",
        use_logo_plate: false,
        logo_url: "https://proj.supabase.co/storage/v1/object/public/avatars/user-1/employer-logo/original.png",
      }),
      {
        displayMode: "transparent",
        logoUrl:
          "https://proj.supabase.co/storage/v1/object/public/avatars/user-1/carousel-logo/processed.png",
      },
    );
  });

  it("uses original logo on plate when use_logo_plate is true", () => {
    assert.deepEqual(
      resolveHomepageShowcaseLogo({
        carousel_logo_path: "user-1/employer-logo/original.png",
        use_logo_plate: true,
        logo_url: "https://proj.supabase.co/storage/v1/object/public/avatars/user-1/employer-logo/original.png",
      }),
      {
        displayMode: "plate",
        logoUrl: "https://proj.supabase.co/storage/v1/object/public/avatars/user-1/employer-logo/original.png",
      },
    );
  });

  it("excludes employer original path without plate", () => {
    assert.equal(
      resolveHomepageShowcaseLogo({
        carousel_logo_path: "user-1/employer-logo/original.png",
        use_logo_plate: false,
        logo_url: "https://proj.supabase.co/storage/v1/object/public/avatars/user-1/employer-logo/original.png",
      }),
      null,
    );
  });

  it("excludes rows without a renderable asset", () => {
    assert.equal(
      resolveHomepageShowcaseLogo({
        carousel_logo_path: "",
        use_logo_plate: false,
        logo_url: "",
      }),
      null,
    );
    assert.equal(
      resolveHomepageShowcaseLogo({
        carousel_logo_path: "user-1/carousel-logo/processed.png",
        use_logo_plate: true,
        logo_url: "",
      }),
      null,
    );
  });

  it("resolves bare storage keys when supabase origin is configured", () => {
    const previous = process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
    try {
      assert.deepEqual(
        resolveHomepageShowcaseLogo({
          carousel_logo_path: "user-1/carousel-logo/processed.png",
          use_logo_plate: false,
          logo_url: "https://cdn.example/original.png",
        }),
        {
          displayMode: "transparent",
          logoUrl:
            "https://proj.supabase.co/storage/v1/object/public/avatars/user-1/carousel-logo/processed.png",
        },
      );
    } finally {
      if (previous === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      else process.env.NEXT_PUBLIC_SUPABASE_URL = previous;
    }
  });

  it("allows external transparent carousel URLs", () => {
    assert.deepEqual(
      resolveHomepageShowcaseLogo({
        carousel_logo_path: "https://cdn.example/carousel.png",
        use_logo_plate: false,
        logo_url: "https://cdn.example/original.png",
      }),
      {
        displayMode: "transparent",
        logoUrl: "https://cdn.example/carousel.png",
      },
    );
  });
});

describe("mapHomepageShowcaseRow", () => {
  it("maps approved transparent carousel asset", () => {
    assert.deepEqual(
      mapHomepageShowcaseRow({
        id: "ep-1",
        public_slug: "acme",
        company_name: "Acme OÜ",
        carousel_logo_path:
          "https://proj.supabase.co/storage/v1/object/public/avatars/user-1/carousel-logo/approved.png",
        use_logo_plate: false,
        logo_url: "https://cdn.example/original.png",
        website: "https://acme.example",
      }),
      {
        id: "ep-1",
        slug: "acme",
        name: "Acme OÜ",
        displayMode: "transparent",
        logoUrl:
          "https://proj.supabase.co/storage/v1/object/public/avatars/user-1/carousel-logo/approved.png",
        website: "https://acme.example",
      },
    );
  });

  it("maps plate mode from original logo", () => {
    assert.deepEqual(
      mapHomepageShowcaseRow({
        id: "ep-1",
        public_slug: "acme",
        company_name: "Acme OÜ",
        carousel_logo_path: "user-1/employer-logo/original.png",
        use_logo_plate: true,
        logo_url: "https://cdn.example/original.png",
        website: null,
      }),
      {
        id: "ep-1",
        slug: "acme",
        name: "Acme OÜ",
        displayMode: "plate",
        logoUrl: "https://cdn.example/original.png",
        website: null,
      },
    );
  });

  it("returns null without carousel asset", () => {
    assert.equal(
      mapHomepageShowcaseRow({
        id: "ep-1",
        public_slug: "acme",
        company_name: "Acme OÜ",
        carousel_logo_path: "",
      }),
      null,
    );
  });

  it("returns null for white-background originals shown directly", () => {
    assert.equal(
      mapHomepageShowcaseRow({
        id: "ep-1",
        public_slug: "acme",
        company_name: "Acme OÜ",
        carousel_logo_path: "user-1/employer-logo/original.png",
        use_logo_plate: false,
        logo_url: "https://cdn.example/original.png",
      }),
      null,
    );
  });
});
