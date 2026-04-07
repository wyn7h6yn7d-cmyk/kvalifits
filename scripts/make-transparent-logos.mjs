import sharp from "sharp";

async function makeTransparent({ input, output, threshold = 18, soften = 0.25 }) {
  // Make near-black pixels transparent, keep edges.
  // Approach: compute luma, build alpha where luma > threshold.
  const img = sharp(input).ensureAlpha();
  const { width, height } = await img.metadata();

  // Extract RGB, compute luma, then create alpha mask.
  const raw = await img.raw().toBuffer();
  const out = Buffer.alloc(raw.length);

  for (let i = 0; i < raw.length; i += 4) {
    const r = raw[i];
    const g = raw[i + 1];
    const b = raw[i + 2];

    // perceptual luma (0..255)
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    // alpha: 0 for very dark; ramp up smoothly past threshold
    let a;
    if (luma <= threshold) a = 0;
    else {
      const t = Math.min(1, (luma - threshold) / (255 - threshold));
      // soften edges a bit
      a = Math.round(255 * Math.pow(t, 1 - soften));
    }

    out[i] = r;
    out[i + 1] = g;
    out[i + 2] = b;
    out[i + 3] = a;
  }

  await sharp(out, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(output);
}

const jobs = [
  {
    input: "public/brand/kvalifits-wordmark.png",
    output: "public/brand/kvalifits-wordmark-transparent.png",
    threshold: 20,
    soften: 0.28,
  },
  {
    input: "public/brand/kvalifits-mark.png",
    output: "public/brand/kvalifits-mark-transparent.png",
    threshold: 20,
    soften: 0.28,
  },
];

for (const j of jobs) {
  await makeTransparent(j);
  console.log(`Wrote ${j.output}`);
}
