/**
 * Client-side upload preparation: resize + re-encode raster images before Supabase Storage.
 * PDFs are not recompressed here (would need pdf-lib or a server job); use size limits instead.
 */

export const MAX_CV_BYTES = 8 * 1024 * 1024;

export type RasterUploadPurpose = "avatar" | "employerLogo" | "certificate";

const MAX_DIM: Record<RasterUploadPurpose, number> = {
  avatar: 512,
  employerLogo: 640,
  certificate: 1920,
};

function scaleDimensions(width: number, height: number, maxDim: number) {
  const longest = Math.max(width, height);
  if (longest <= maxDim) return { width, height };
  const scale = maxDim / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("toBlob failed"));
      },
      type,
      quality,
    );
  });
}

/**
 * Shrinks and re-encodes photos for faster uploads and less storage bandwidth.
 * Leaves non-images, SVG, GIF, PDF, and undecodable files unchanged.
 */
export async function prepareRasterImageForUpload(
  file: File,
  purpose: RasterUploadPurpose,
): Promise<File> {
  if (typeof createImageBitmap === "undefined" || typeof document === "undefined") {
    return file;
  }
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;

  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  try {
    const maxDim = MAX_DIM[purpose];
    const { width: tw, height: th } = scaleDimensions(bitmap.width, bitmap.height, maxDim);

    if (
      purpose === "avatar" &&
      tw === bitmap.width &&
      th === bitmap.height &&
      file.type === "image/jpeg" &&
      file.size < 200_000
    ) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, tw, th);
    bitmap.close();
    bitmap = undefined;

    const base = file.name.replace(/\.[^.]+$/, "").replace(/[^\w\-]+/g, "-").slice(0, 48) || "image";

    if (purpose === "avatar" || purpose === "certificate") {
      const blob = await canvasToBlob(canvas, "image/jpeg", purpose === "avatar" ? 0.82 : 0.86);
      return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
    }

    try {
      const webpBlob = await canvasToBlob(canvas, "image/webp", 0.88);
      if (webpBlob.size > 0) {
        return new File([webpBlob], `${base}.webp`, { type: "image/webp" });
      }
    } catch {
      // fall through to PNG / JPEG
    }
    try {
      const pngBlob = await canvasToBlob(canvas, "image/png");
      return new File([pngBlob], `${base}.png`, { type: "image/png" });
    } catch {
      const jpegBlob = await canvasToBlob(canvas, "image/jpeg", 0.9);
      return new File([jpegBlob], `${base}.jpg`, { type: "image/jpeg" });
    }
  } catch {
    try {
      bitmap?.close();
    } catch {
      /* ignore */
    }
    return file;
  }
}
