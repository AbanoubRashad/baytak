// Downloads the illustrative Unsplash photos listed in src/data/photos.json into public/photos/.
// Runs before `next build`; files that already exist are skipped, so it is cheap to re-run.
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(join(root, 'src/data/photos.json'), 'utf8'));
const outDir = join(root, 'public/photos');
await mkdir(outDir, { recursive: true });

const exists = (p) => stat(p).then(() => true, () => false);
let fetched = 0;
let failed = 0;

await Promise.all(
  Object.entries(manifest).map(async ([name, id]) => {
    const file = join(outDir, `${name}.jpg`);
    if (await exists(file)) return;
    const url = `https://images.unsplash.com/photo-${id}?w=1800&q=80&fm=jpg`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await writeFile(file, Buffer.from(await res.arrayBuffer()));
      fetched++;
    } catch (err) {
      failed++;
      console.warn(`[photos] ${name}: ${err.message}`);
    }
  }),
);

console.log(`[photos] ${fetched} downloaded, ${Object.keys(manifest).length - fetched - failed} already present, ${failed} failed`);
if (failed && process.env.CI) process.exit(1);
