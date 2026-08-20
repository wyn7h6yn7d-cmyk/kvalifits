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
async function circularPng(inputPath, size) {
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

  return sharp(padded)
    .composite([{ input: circleSvg, blend: "dest-in" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

const source = join(root, "public/favicon-source.png");

async function main() {
  if (!fs.existsSync(source)) {
    console.error(
      "Missing public/favicon-source.png — copy the square k+dot asset there once, then run this script.",
    );
    process.exit(1);
  }

  const base512 = await circularPng(source, 512);

  async function writePng(size, relativePath) {
    const buf = await sharp(base512).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
    fs.writeFileSync(join(root, relativePath), buf);
  }

  await writePng(48, "public/favicon-48.png");
  await writePng(96, "public/favicon-96.png");
  await writePng(128, "public/favicon-v4.png");
  await writePng(128, "public/favicon.png");
  await writePng(180, "public/apple-touch-icon.png");
  await writePng(192, "public/favicon-192.png");
  await writePng(192, "app/icon.png");
  await writePng(256, "public/favicon-256.png");

  const png16 = await sharp(base512).resize(16, 16).png().toBuffer();
  const png32 = await sharp(base512).resize(32, 32).png().toBuffer();
  const png48 = await sharp(base512).resize(48, 48).png().toBuffer();
  const icoBuf = await pngToIco([png16, png32, png48]);
  fs.writeFileSync(join(root, "public/favicon-v4.ico"), icoBuf);
  fs.writeFileSync(join(root, "public/favicon.ico"), icoBuf);
  fs.writeFileSync(join(root, "app/favicon.ico"), icoBuf);

  console.log(
    "Wrote favicon 16/32/48/96/128/180/192/256 PNG+ICO assets (public + app/icon.png + app/favicon.ico).",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
