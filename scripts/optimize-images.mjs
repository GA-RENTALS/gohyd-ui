// Makes small WebP copies of the website photos: public/assets/img/<name>-<640|1200|1920>.jpg -> public/assets/img/w/<name>-<width>.webp
// Run after adding or replacing a photo:  node scripts/optimize-images.mjs
// Widths match what layouts actually need (phones ~400-800px, desktop cards ~600px, full-bleed hero up to 1600px).
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const SRC = fileURLToPath(new URL("../public/assets/img/", import.meta.url));
const OUT = join(SRC, "w");
const WIDTHS = [480, 800, 1200, 1600];
mkdirSync(OUT, { recursive: true });

// one source per photo: the biggest JPEG available
const best = new Map();
for (const file of readdirSync(SRC).filter((f) => f.endsWith(".jpg"))) {
  const m = file.match(/^(.*?)(?:-(640|1200|1920))?\.jpg$/);
  const name = m[1], size = Number(m[2] || 99999);
  if (!best.has(name) || best.get(name).size < size) best.set(name, { file, size });
}

const manifest = {};
let before = 0, after = 0;
for (const [name, { file }] of best) {
  const img = sharp(join(SRC, file));
  const { width, height } = await img.metadata();
  const widths = WIDTHS.filter((w) => w < width);
  if (!widths.length || widths[widths.length - 1] < width) widths.push(Math.min(width, 1600));
  manifest[name] = { width, height, widths: [...new Set(widths)] };
  for (const w of manifest[name].widths) {
    const out = join(OUT, `${name}-${w}.webp`);
    const info = await sharp(join(SRC, file)).resize({ width: w, withoutEnlargement: true }).webp({ quality: 72, effort: 5 }).toFile(out);
    after += info.size;
  }
  before += (await import("node:fs")).statSync(join(SRC, file)).size;
}
writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`${best.size} photos -> ${Object.values(manifest).reduce((a, m) => a + m.widths.length, 0)} WebP files`);
console.log(`largest JPEGs: ${(before / 1048576).toFixed(1)} MB; all WebP sizes together: ${(after / 1048576).toFixed(1)} MB`);
