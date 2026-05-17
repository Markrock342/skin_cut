#!/usr/bin/env node
/**
 * สร้าง catalog รายการไอเทม Arena Breakout จาก public/assets/arena-breakout/items
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ITEMS_ROOT = path.join(__dirname, '../public/assets/arena-breakout/items');
const OUT = path.join(__dirname, '../src/data/arena-breakout/items.json');

const CATEGORY_MAP = {
  'สกินมีด': 'knife',
  'สกินปืน': 'gun',
  'สกินชุด': 'outfit',
  'สกินถุงมือ': 'gloves',
  'กรอบโปรไฟล์': 'profileFrame',
  'ฉายา': 'title',
  'พื้นหลังรูป': 'bgCharacter',
  'พื้นหลังโปรไฟล์': 'bgProfile',
};

const IMAGE_EXT = /\.(png|jpe?g|webp)$/i;

function walk(dir, parts = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...walk(full, [...parts, e.name]));
    } else if (IMAGE_EXT.test(e.name)) {
      files.push({ parts, file: e.name, full });
    }
  }
  return files;
}

function slug(parts, file) {
  const raw = [...parts, file.replace(IMAGE_EXT, '')].join('-');
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\u0e00-\u0e7f]+/gi, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function build() {
  const items = [];
  const topDirs = fs.readdirSync(ITEMS_ROOT, { withFileTypes: true });

  for (const dir of topDirs) {
    if (!dir.isDirectory()) continue;
    const category = CATEGORY_MAP[dir.name];
    if (!category) continue;

    const catPath = path.join(ITEMS_ROOT, dir.name);
    const found = walk(catPath, []);

    for (const { parts, file } of found) {
      const rel = path.posix.join(
        'items',
        dir.name,
        ...parts.map(encodeURIComponent),
        encodeURIComponent(file),
      );
      const label =
        parts.length > 0
          ? `${parts[parts.length - 1]}`.replace(/✅\(\d+\)/g, '').trim()
          : file.replace(IMAGE_EXT, '');

      items.push({
        id: `${category}-${slug(parts, file)}`,
        category,
        name: label || file,
        imageUrl: `/assets/arena-breakout/${rel.split('/').map((s, i) => (i === 0 ? s : s)).join('/')}`,
      });
    }
  }

  // fix imageUrl - use proper encoding per segment
  for (const item of items) {
    const relPath = item.imageUrl.replace('/assets/arena-breakout/', '');
    const segments = relPath.split('/');
    item.imageUrl = `/assets/arena-breakout/${segments.map((s) => encodeURI(decodeURI(s))).join('/')}`;
  }

  // Rebuild imageUrl correctly from filesystem
  const itemsFixed = [];
  for (const dir of topDirs) {
    if (!dir.isDirectory()) continue;
    const category = CATEGORY_MAP[dir.name];
    if (!category) continue;
    const catPath = path.join(ITEMS_ROOT, dir.name);
    const found = walk(catPath, []);
    for (const { parts, file } of found) {
      const urlParts = ['', 'assets', 'arena-breakout', 'items', dir.name, ...parts, file];
      const imageUrl = urlParts.map((p) => encodeURIComponent(p).replace(/^%2F/, '/')).join('/').replace(/%2F/g, '/');
      // encodeURIComponent on each segment except leading empty
      const imageUrl2 =
        '/assets/arena-breakout/items/' +
        [dir.name, ...parts, file].map((p) => encodeURIComponent(p)).join('/');

      const label =
        parts.length > 0
          ? parts[parts.length - 1].replace(/✅\(\d+\)/g, '').trim()
          : file.replace(IMAGE_EXT, '');

      itemsFixed.push({
        id: `${category}-${slug(parts, file)}`,
        category,
        name: label || file,
        imageUrl: imageUrl2,
      });
    }
  }

  const byCategory = {};
  for (const item of itemsFixed) {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  }

  const output = {
    generatedAt: new Date().toISOString(),
    total: itemsFixed.length,
    byCategory,
    items: itemsFixed,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(output, null, 2));
  console.log(`Wrote ${OUT} — ${itemsFixed.length} items`);
  for (const [k, v] of Object.entries(byCategory)) {
    console.log(`  ${k}: ${v.length}`);
  }
}

build();
