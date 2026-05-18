#!/usr/bin/env node
/**
 * แตก APK (ZIP) หลายไฟล์ลงโฟลเดอร์เดียว — ใช้กับ base + split จาก Play
 *
 * ต้องมีไฟล์ APK จากแหล่งที่คุณมีสิทธิ์ใช้ (เช่น ดึงจากเครื่องตัวเองด้วย adb)
 *
 * Usage:
 *   node scripts/extract-apk.mjs --out=scratch/apk-rov base.apk "split_config.arm64_v8a.apk"
 *   npm run extract:apk -- --out=scratch/apk-rov ./path/base.apk
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  }),
);

const positionals = process.argv.slice(2).filter((a) => !a.startsWith('--'));

function usage() {
  console.log(`Usage:
  node scripts/extract-apk.mjs [--out=DIR] <file.apk> [more.apk ...]

  npm run extract:apk -- --out=scratch/apk-rov ./base.apk ./split_xx.apk

Default --out: scratch/apk-extract (relative to repo root)
`);
}

if (args.help === 'true' || args.h === 'true') {
  usage();
  process.exit(0);
}

const outArg = args.out ?? 'scratch/apk-extract';
const outDir = path.isAbsolute(outArg) ? outArg : path.join(ROOT, outArg);
const apkPaths = positionals.map((p) => (path.isAbsolute(p) ? p : path.join(process.cwd(), p)));

if (!apkPaths.length) {
  usage();
  process.exit(1);
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function* walkFiles(dir, maxDepth, depth = 0) {
  if (depth > maxDepth) return;
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walkFiles(full, maxDepth, depth + 1);
    else yield full;
  }
}

function extOf(file) {
  const b = path.basename(file);
  const i = b.lastIndexOf('.');
  return i === -1 ? '' : b.slice(i).toLowerCase();
}

async function summarizeAssets(assetsRoot) {
  if (!(await exists(assetsRoot))) return null;
  const byExt = new Map();
  let n = 0;
  let bytes = 0;
  const largest = [];
  for await (const f of walkFiles(assetsRoot, 8)) {
    n += 1;
    const st = await fs.stat(f);
    bytes += st.size;
    const ext = extOf(f) || '(no ext)';
    byExt.set(ext, (byExt.get(ext) ?? 0) + 1);
    largest.push({ f, size: st.size });
  }
  largest.sort((a, b) => b.size - a.size);
  return { n, bytes, byExt, top: largest.slice(0, 12) };
}

async function findUnder(root, name, maxDepth = 5) {
  if (!(await exists(root))) return [];
  const hits = [];
  for await (const f of walkFiles(root, maxDepth)) {
    if (path.basename(f) === name) hits.push(f);
    if (hits.length >= 20) break;
  }
  return hits;
}

async function main() {
  for (const p of apkPaths) {
    if (!(await exists(p))) {
      console.error(`Missing file: ${p}`);
      process.exit(1);
    }
  }

  await fs.mkdir(outDir, { recursive: true });

  for (const apk of apkPaths) {
    console.log(`Unzip: ${apk}`);
    try {
      execFileSync('unzip', ['-o', '-q', apk, '-d', outDir], { stdio: 'inherit' });
    } catch {
      console.error('`unzip` failed. On macOS install Xcode tools or use: brew install unzip');
      process.exit(1);
    }
  }

  const libUnity = await findUnder(path.join(outDir, 'lib'), 'libunity.so', 4).catch(() => []);
  const metadata = await findUnder(path.join(outDir, 'assets'), 'global-metadata.dat', 10).catch(() => []);
  const dataUnity = await exists(path.join(outDir, 'assets', 'bin', 'Data'));

  const assetsRoot = path.join(outDir, 'assets');
  const sum = await summarizeAssets(assetsRoot);

  console.log('\n--- Summary ---');
  console.log(`Output: ${outDir}`);
  console.log(`Unity libunity.so: ${libUnity.length ? libUnity.join(', ') : '(not found)'}`);
  console.log(`Unity assets/bin/Data: ${dataUnity ? 'yes' : 'no'}`);
  console.log(
    `IL2CPP global-metadata.dat: ${metadata.length ? metadata.slice(0, 3).join(', ') : '(not found)'}`,
  );

  if (sum) {
    console.log(`\nassets/: ${sum.n} files, ${(sum.bytes / (1024 * 1024)).toFixed(1)} MiB total`);
    const exts = [...sum.byExt.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
    console.log('Top extensions:', exts.map(([e, c]) => `${e}:${c}`).join(', '));
    console.log('\nLargest files under assets/:');
    for (const { f, size } of sum.top) {
      console.log(`  ${(size / (1024 * 1024)).toFixed(2)} MiB  ${path.relative(outDir, f)}`);
    }
  }

  console.log(`
Next (manual):
  - Unity textures/sprites: open folder in AssetStudio / UnityPy (scan "${path.join(outDir, 'assets')}")
  - Strings / URLs: jadx on classes*.dex inside APK (or on extracted root if DEX at top level)
  - Profile frames may NOT be in APK; check runtime downloads / Addressables under assets/aa
`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => {
  console.error(e);
  process.exit(1);
});
