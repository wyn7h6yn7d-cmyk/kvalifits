export type Rgb = [number, number, number];

export function rgbDistance(a: Rgb, b: Rgb): number {
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
}

export function cornersAgree(corners: Rgb[], maxSpread: number): boolean {
  if (corners.length < 2) return false;
  const base = corners[0]!;
  return corners.every((c) => rgbDistance(base, c) <= maxSpread);
}

export function averageRgb(samples: Rgb[]): Rgb {
  if (!samples.length) return [255, 255, 255];
  const sum: Rgb = [0, 0, 0];
  for (const [r, g, b] of samples) {
    sum[0] += r;
    sum[1] += g;
    sum[2] += b;
  }
  return [
    Math.round(sum[0] / samples.length),
    Math.round(sum[1] / samples.length),
    Math.round(sum[2] / samples.length),
  ];
}

export function sampleCornerRgba(
  data: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
): Rgb {
  const clampedX = Math.max(0, Math.min(width - 1, x));
  const clampedY = Math.max(0, Math.min(height - 1, y));
  const i = (clampedY * width + clampedX) * 4;
  return [data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0];
}

export type RemoveFlatBackgroundResult =
  | { ok: true; data: Uint8Array; removedFraction: number }
  | { ok: false; reason: "corners_disagree" | "removed_too_much" | "removed_too_little" };

/** Remove a flat background inferred from corners when they agree on a light/neutral tone. */
export function removeFlatBackgroundFromRgba(
  data: Uint8Array,
  width: number,
  height: number,
  opts?: { tolerance?: number; cornerSpread?: number; maxRemovedFraction?: number; minRemovedFraction?: number },
): RemoveFlatBackgroundResult {
  const tolerance = opts?.tolerance ?? 28;
  const cornerSpread = opts?.cornerSpread ?? 20;
  const maxRemovedFraction = opts?.maxRemovedFraction ?? 0.78;
  const minRemovedFraction = opts?.minRemovedFraction ?? 0.02;

  const inset = Math.max(1, Math.min(4, Math.floor(Math.min(width, height) * 0.02)));
  const corners = [
    sampleCornerRgba(data, width, height, inset, inset),
    sampleCornerRgba(data, width, height, width - 1 - inset, inset),
    sampleCornerRgba(data, width, height, inset, height - 1 - inset),
    sampleCornerRgba(data, width, height, width - 1 - inset, height - 1 - inset),
  ];

  if (!cornersAgree(corners, cornerSpread)) {
    return { ok: false, reason: "corners_disagree" };
  }

  const bg = averageRgb(corners);
  const isLightBackground = bg[0] >= 210 && bg[1] >= 210 && bg[2] >= 210;
  if (!isLightBackground) {
    return { ok: false, reason: "corners_disagree" };
  }

  const out = new Uint8Array(data);
  let removed = 0;
  const total = width * height;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const pixel: Rgb = [out[i] ?? 0, out[i + 1] ?? 0, out[i + 2] ?? 0];
      if (rgbDistance(pixel, bg) <= tolerance) {
        out[i + 3] = 0;
        removed++;
      }
    }
  }

  const removedFraction = removed / total;
  if (removedFraction > maxRemovedFraction) return { ok: false, reason: "removed_too_much" };
  if (removedFraction < minRemovedFraction) return { ok: false, reason: "removed_too_little" };

  return { ok: true, data: out, removedFraction };
}

export function countTransparentFraction(data: Uint8Array): number {
  if (!data.length) return 0;
  let transparent = 0;
  const pixels = data.length / 4;
  for (let i = 3; i < data.length; i += 4) {
    if ((data[i] ?? 255) < 240) transparent++;
  }
  return transparent / pixels;
}
