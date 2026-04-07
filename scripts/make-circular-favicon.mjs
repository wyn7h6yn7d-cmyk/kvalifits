import sharp from "sharp";
import pngToIco from "png-to-ico";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

/**
 * Square image → circular mask (transparent outside the circle).
 * Logo is scaled with margin so the k + dot stay inside the ring.
 */
async function circularPng(inputPath, outputPath, size) {
  const margin = 0.06;
  const inner = Math.round(size * (1 - 2 * margin));

  const logo = await sharp(inputPath)
    .resize(inner, inner, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .png()
    .toBuffer();

  const padded = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toBuffer();

  const circleSvg = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
    </svg>`,
  );

  await sharp(padded)
    .composite([{ input: circleSvg, blend: "dest-in" }])
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}

const source = join(root, "public/favicon-source.png");

async function main() {
  if (!fs.existsSync(source)) {
    console.error(
      "Missing public/favicon-source.png — copy the square k+dot asset there once, then run this script.",
    );
    process.exit(1);
  }

  const tmp512 = join(root, ".tmp-favicon-512.png");
  await circularPng(source, tmp512, 512);

  await sharp(tmp512).resize(128, 128).png({ compressionLevel: 9 }).toFile(join(root, "public/favicon.png"));
  await sharp(tmp512).resize(128, 128).png({ compressionLevel: 9 }).toFile(join(root, "app/icon.png"));
  await sharp(tmp512).resize(180, 180).png({ compressionLevel: 9 }).toFile(join(root, "app/apple-icon.png"));

  fs.unlinkSync(tmp512);

  const icoBuf = await pngToIco(join(root, "public/favicon.png"));
  fs.writeFileSync(join(root, "public/favicon.ico"), icoBuf);

  console.log(
    "Wrote circular public/favicon.png, app/icon.png, app/apple-icon.png, public/favicon.ico (from favicon-source.png)",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
