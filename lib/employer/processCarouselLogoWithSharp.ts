import sharp from "sharp";

import {
  countTransparentFraction,
  removeFlatBackgroundFromRgba,
} from "@/lib/employer/processCarouselLogoImage";

const MAX_CAROUSEL_DIM = 512;

export type ProcessCarouselLogoImageResult =
  | { ok: true; buffer: Buffer }
  | { ok: false; reason: string };

async function finalizePng(input: Buffer | Uint8Array, width: number, height: number): Promise<Buffer> {
  return sharp(input, { raw: { width, height, channels: 4 } })
    .resize({
      width: MAX_CAROUSEL_DIM,
      height: MAX_CAROUSEL_DIM,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png({ compressionLevel: 9, effort: 7 })
    .toBuffer();
}

/** Best-effort carousel asset: preserve alpha or remove a simple light flat background. */
export async function processCarouselLogoWithSharp(input: Buffer): Promise<ProcessCarouselLogoImageResult> {
  let meta: sharp.Metadata;
  try {
    meta = await sharp(input).metadata();
  } catch {
    return { ok: false, reason: "decode_failed" };
  }

  if (meta.format === "gif") return { ok: false, reason: "unsupported_gif" };
  if (!meta.width || !meta.height) return { ok: false, reason: "invalid_dimensions" };

  let raw: Buffer;
  let info: sharp.OutputInfo;
  try {
    const result = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    raw = result.data;
    info = result.info;
  } catch {
    return { ok: false, reason: "decode_failed" };
  }

  const transparentFraction = countTransparentFraction(raw);
  if (transparentFraction >= 0.04) {
    try {
      const buffer = await finalizePng(raw, info.width, info.height);
      return { ok: true, buffer };
    } catch {
      return { ok: false, reason: "encode_failed" };
    }
  }

  const removed = removeFlatBackgroundFromRgba(raw, info.width, info.height);
  if (!removed.ok) {
    return { ok: false, reason: removed.reason };
  }

  try {
    const buffer = await finalizePng(removed.data, info.width, info.height);
    return { ok: true, buffer };
  } catch {
    return { ok: false, reason: "encode_failed" };
  }
}
