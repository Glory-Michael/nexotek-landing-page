#!/usr/bin/env node
// Re-encode public JPEGs to a sane web-served size. Originals are moved to
// public/brand/photos/.originals/ on first run; re-running is a no-op for
// files that already have a backup.
//
// Defaults: max 2400px wide, mozjpeg quality 82, strip metadata. Safe for
// hero/photo grids — next/image will resize further per request from these.

import { readdir, mkdir, copyFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.join(process.cwd(), 'public', 'brand', 'photos');
const BACKUP = path.join(ROOT, '.originals');
const MAX_WIDTH = 2400;
const QUALITY = 82;

async function processFile(file) {
  const src = path.join(ROOT, file);
  const backup = path.join(BACKUP, file);

  if (existsSync(backup)) {
    console.log(`  skip   ${file} (already optimized — backup present)`);
    return { skipped: true };
  }

  const beforeSize = (await stat(src)).size;
  await copyFile(src, backup);

  const buffer = await sharp(src)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true, progressive: true })
    .toBuffer();

  await sharp(buffer).toFile(src);
  const afterSize = (await stat(src)).size;

  const pct = (((beforeSize - afterSize) / beforeSize) * 100).toFixed(1);
  console.log(
    `  ✓ ${file.padEnd(36)} ${(beforeSize / 1024).toFixed(0).padStart(5)} KB → ${(afterSize / 1024).toFixed(0).padStart(4)} KB  (−${pct}%)`,
  );
  return { saved: beforeSize - afterSize };
}

async function main() {
  if (!existsSync(BACKUP)) await mkdir(BACKUP, { recursive: true });

  const files = (await readdir(ROOT)).filter(
    (f) => /\.(jpe?g)$/i.test(f) && !f.startsWith('.'),
  );

  console.log(`Optimizing ${files.length} JPEG(s) in ${ROOT}\n`);

  let totalSaved = 0;
  for (const file of files) {
    const { saved = 0 } = await processFile(file);
    totalSaved += saved;
  }

  console.log(
    `\nDone. Total saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`,
  );
  console.log(`Originals preserved in ${BACKUP}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
