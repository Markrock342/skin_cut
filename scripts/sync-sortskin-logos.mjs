#!/usr/bin/env node
/** ดึงโลโก้เกมจาก SortSkin R2 → public/assets/games/ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../public/assets/games');

const LOGOS = {
  'rov.png':
    'https://pub-603937e0ef90496f818f5e96bc337ba7.r2.dev/game-logos/1777619893186-unnamed.png',
  'mlbb.png':
    'https://pub-603937e0ef90496f818f5e96bc337ba7.r2.dev/game-logos/1761832643049-68ca5b05a7169_com.mobile.legends.png',
};

fs.mkdirSync(OUT, { recursive: true });

for (const [file, url] of Object.entries(LOGOS)) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${file}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path.join(OUT, file), buf);
  console.log('✓', file);
}

console.log('เสร็จ — arena-breakout.png ใส่เองหรืออัป R2 แล้ว sync');
