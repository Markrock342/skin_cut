#!/usr/bin/env node
/**
 * ดึง APK จากมือถือที่เสียบอยู่ (adb) แล้วแตกลงโฟลเดอร์บนคอม
 *
 * เงื่อนไข:
 *   - ติดตั้ง platform-tools (คำสั่ง `adb`)
 *   - เปิดตัวเลือกนักพัฒนา + USB debugging บนมือถือ
 *   - เสียบสาย กดอนุญาตคอมเครื่องนี้
 *
 * บางรุ่น `adb pull` จาก /data/app ไม่ได้ — สคริปต์จะลอง `cp` ไป /sdcard/Download ก่อนแล้วค่อย pull
 *
 * Usage:
 *   npm run extract:rov:from-phone
 *   node scripts/pull-rov-apk-and-extract.mjs --package=com.garena.game.kgth
 *   ANDROID_SERIAL=R58M... node scripts/pull-rov-apk-and-extract.mjs
 */
import { execFileSync, spawnSync } from 'node:child_process';
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

const PKG = args.package ?? 'com.garena.game.kgth';
const outRootRel = args['out-root'] ?? 'scratch/apk-rov-device';
const serial = args.serial ?? process.env.ANDROID_SERIAL ?? '';

function usage() {
  console.log(`Usage:
  npm run extract:rov:from-phone

Options:
  --package=com.garena.game.kgth   (default ROV TH)
  --out-root=scratch/apk-rov-device
  --serial=DEVICE_ID               (หรือตั้ง ANDROID_SERIAL)

Output:
  <out-root>/apks/*.apk     ไฟล์ดึงจากมือถือ
  <out-root>/unpacked/      ผลแตก (เปิด assets/ ใน AssetStudio)
`);
}

if (args.help === 'true' || args.h === 'true') {
  usage();
  process.exit(0);
}

function adbPrefix() {
  return serial ? ['-s', serial] : [];
}

function adb(args, opts = {}) {
  return execFileSync('adb', [...adbPrefix(), ...args], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    ...opts,
  });
}

function assertAdb() {
  try {
    execFileSync('adb', ['version'], { stdio: 'pipe' });
  } catch {
    console.error('ไม่พบ `adb` — ติดตั้ง: brew install android-platform-tools');
    process.exit(1);
  }
}

/** คอลัมน์สถานะของ `adb devices -l` คือคำที่สอง (หลัง serial) — ห้ามใช้แค่ \\tdevice เพราะช่องว่างอาจเป็นช่องว่างหลายตัว และหลัง device ยังมี usb: product: … */
function listUsbDevices() {
  const text = adb(['devices', '-l']);
  const lines = text
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  const ok = [];
  for (const l of lines) {
    const parts = l.split(/\s+/).filter(Boolean);
    if (parts.length < 2) continue;
    if (parts[1] === 'device') ok.push(parts[0]);
  }
  return ok;
}

function parsePmPath(text) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^package:/, '').trim())
    .filter(Boolean);
}

function safeBasename(p, i) {
  const b = path.posix.basename(p.replace(/\\/g, '/'));
  if (/^[a-zA-Z0-9._-]+\.apk$/i.test(b)) return b;
  return `split_${i}.apk`;
}

function pullOne(remote, localFile) {
  const pre = adbPrefix();
  try {
    execFileSync('adb', [...pre, 'pull', remote, localFile], { stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
}

function pullViaDownload(remote, localFile) {
  const pre = adbPrefix();
  const stamp = `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  const sd = `/sdcard/Download/skin_cut_apk_${stamp}.apk`;
  try {
    execFileSync('adb', [...pre, 'shell', 'cp', remote, sd], { stdio: 'inherit' });
    execFileSync('adb', [...pre, 'pull', sd, localFile], { stdio: 'inherit' });
    execFileSync('adb', [...pre, 'shell', 'rm', '-f', sd], { stdio: 'pipe' });
    return true;
  } catch {
    try {
      execFileSync('adb', [...pre, 'shell', 'rm', '-f', sd], { stdio: 'pipe' });
    } catch {
      /* ignore */
    }
    return false;
  }
}

async function main() {
  assertAdb();
  const devices = listUsbDevices();
  if (devices.length === 0) {
    let raw = '';
    try {
      raw = adb(['devices', '-l']).trim();
    } catch {
      raw = '(adb devices ล้มเหลว)';
    }
    console.error('ไม่มีเครื่องในโหมด device — เสียบสาย เปิด USB debugging กดอนุญาต');
    console.error('\nผล `adb devices -l` ตอนนี้:\n', raw || '(ว่าง)');
    console.error(`
ถ้าเห็น unauthorized → ดูมือถือแล้วกดอนุญาต RSA อีกครั้ง
ถ้าเห็น no permissions / offline → ถอดสาย ปิด USB debugging เปิดใหม่ หรือ adb kill-server && adb start-server
โหมด USB บนมือถือต้องไม่ใช่แค่ชาร์จ (ถ่ายโอนไฟล์ / MIDI ก็ได้บางรุ่น)`);
    process.exit(1);
  }
  if (devices.length > 1 && !serial) {
    console.error('มีหลายเครื่อง — ระบุหนึ่งในนี้:\n  ', devices.join('\n   '));
    console.error('\nรัน: ANDROID_SERIAL=<id> npm run extract:rov:from-phone');
    process.exit(1);
  }

  let text;
  try {
    text = adb(['shell', 'pm', 'path', PKG]);
  } catch (e) {
    console.error(`pm path ล้มเหลว — ตรวจว่าติดตั้งแอป ${PKG} บนเครื่องนี้`);
    console.error(e?.message ?? e);
    process.exit(1);
  }

  const remotes = parsePmPath(text);
  if (!remotes.length) {
    console.error(`ไม่ได้ path จาก pm — แพ็กเกจ ${PKG} อาจไม่ได้ติดตั้ง`);
    process.exit(1);
  }

  const outRoot = path.join(ROOT, outRootRel);
  const apkDir = path.join(outRoot, 'apks');
  const unpacked = path.join(outRoot, 'unpacked');
  await fs.mkdir(apkDir, { recursive: true });

  console.log(`Package: ${PKG}`);
  console.log(`พบ ${remotes.length} ไฟล์ APK บนเครื่อง\n`);

  const locals = [];
  for (let i = 0; i < remotes.length; i += 1) {
    const remote = remotes[i];
    const name = safeBasename(remote, i);
    const localFile = path.join(apkDir, `${i}_${name}`);
    process.stdout.write(`Pull: ${remote}\n  -> ${localFile}\n`);
    let ok = pullOne(remote, localFile);
    if (!ok) {
      process.stdout.write('  direct pull ไม่ได้ — ลอง cp ไป /sdcard/Download …\n');
      ok = pullViaDownload(remote, localFile);
    }
    if (!ok) {
      console.error('  ล้มเหลว — รุ่นนี้บล็อกการอ่าน APK (ลองรูท / หรือดึง APK จากแหล่งอื่น)');
      process.exit(1);
    }
    locals.push(localFile);
  }

  console.log('\nแตก APK ลง unpacked/ …');
  const extractScript = path.join(__dirname, 'extract-apk.mjs');
  const r = spawnSync(process.execPath, [extractScript, `--out=${unpacked}`, ...locals], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }

  console.log(`\nเสร็จแล้ว
  APK ดิบ:  ${apkDir}
  แตกแล้ว: ${unpacked}
  เปิด AssetStudio โหลดโฟลเดอร์: ${path.join(unpacked, 'assets')}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
