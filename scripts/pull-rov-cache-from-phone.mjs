#!/usr/bin/env node
/**
 * ดึง cache / ไฟล์ที่เกมโหลดแล้วจากมือถือ (หลังเปิดเกม + เข้าหน้ากรอบโปรไฟล์)
 * บางเครื่องยังดึงไม่ได้เพราะ Scoped Storage
 */
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PKG = 'com.garena.game.kgth';
const OUT = path.join(ROOT, 'scratch', 'rov-phone-cache');

function adb(args) {
  return execFileSync('adb', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

function assertDevice() {
  const lines = adb(['devices'])
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .filter((l) => l.trim());
  const ok = lines.filter((l) => l.split(/\s+/)[1] === 'device');
  if (!ok.length) {
    console.error('ไม่มีเครื่อง — เสียบสาย + USB debugging + อนุญาต');
    process.exit(1);
  }
}

async function main() {
  assertDevice();
  await fs.mkdir(OUT, { recursive: true });

  const roots = [
    `/sdcard/Android/data/${PKG}`,
    `/sdcard/Android/obb/${PKG}`,
    `/sdcard/Android/data/${PKG}/files`,
    `/sdcard/Android/data/${PKG}/cache`,
  ];

  console.log('ค้นหาไฟล์บนมือถือ (อาจใช้เวลา)…');
  let found = '';
  for (const root of roots) {
    try {
      found += adb([
        'shell',
        `find "${root}" -type f \\( -iname '*uisystem*' -o -iname '*lobby*' -o -iname '*systemlobby*' -o -iname '*head*' -o -iname '*frame*' -o -iname '*avatar*' -o -iname '*profile*' -o -iname '*.assetbundle' \\) 2>/dev/null | head -250`,
      ]);
    } catch {
      /* path blocked */
    }
  }

  const paths = [...new Set(found.split(/\r?\n/).map((l) => l.trim()).filter(Boolean))];
  if (!paths.length) {
    console.log(`ไม่พบไฟล์ — ลองเปิดเกมเข้าเมนูกรอบโปรไฟล์แล้วรันซ้ำ
หรือเครื่องบล็อก /sdcard/Android/data (ปกติบน Android 11+)`);
    process.exit(2);
  }

  console.log(`พบ ${paths.length} ไฟล์ — กำลัง pull…`);
  let n = 0;
  for (const remote of paths) {
    const bn = path.posix.basename(remote.replace(/\\/g, '/'));
    const safe = bn.replace(/[^\w.\-]+/g, '_').slice(0, 100) || 'file';
    const h = crypto.createHash('sha256').update(remote).digest('hex').slice(0, 12);
    const local = path.join(OUT, `${h}_${safe}`);
    try {
      execFileSync('adb', ['pull', remote, local], { stdio: 'pipe' });
      n += 1;
      console.log('  ok', `${h}_${safe}`);
    } catch {
      console.log('  skip', remote);
    }
  }

  console.log(`\nดึงได้ ${n} ไฟล์ → ${OUT}`);
  console.log('ลอง: npm run extract:rov:textures -- --src=scratch/rov-phone-cache');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
