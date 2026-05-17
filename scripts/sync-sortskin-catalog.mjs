#!/usr/bin/env node
/**
 * ดึงรายชื่อฮีโร่ + สกิน + รูป จาก SortSkin (เว็บตัวเอง)
 *
 *   npm run sync:sortskin:rov              # catalog + รูป local (ช้า ~1100 ไฟล์)
 *   npm run sync:sortskin:rov -- --json-only   # แค่ catalog ใช้ URL R2 (เร็ว)
 *   npm run sync:sortskin:rov -- --heroes=5    # ทดสอบ 5 ฮีโร่
 *   npm run sync:sortskin:mlbb
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const PAGES = {
  rov: 'https://sortskin.com/games/generate/rov',
  mlbb: 'https://sortskin.com/games/generate/mobilelegend',
};

const TIERS = ['limited', 'ultimate', 'mythic', 'epic', 'elite', 'normal'];

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  }),
);

const game = args.game === 'mlbb' ? 'mlbb' : 'rov';
const jsonOnly = args['json-only'] === 'true';
const heroLimit = args.heroes ? Number(args.heroes) : Infinity;
const concurrency = Number(args.concurrency ?? 12);

function slug(name) {
  return name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function extFromUrl(url) {
  const m = url.match(/\.(webp|png|jpe?g)(\?|$)/i);
  return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : 'webp';
}

function parseSortskinHtml(html) {
  const re =
    /\\"name\\":\\"([^"\\]+)\\",\\"createdAt\\":[^,]+,\\"skins\\":\[([\s\S]*?)\]\}/g;
  const heroes = [];
  let m;
  while ((m = re.exec(html))) {
    const name = m[1];
    const skinsRaw = m[2];
    const skinRe = /\\"name\\":\\"([^"\\]+)\\",\\"imageUrl\\":\\"(https:[^"\\]+)\\"/g;
    const skins = [];
    let sm;
    while ((sm = skinRe.exec(skinsRaw))) {
      skins.push({ name: sm[1], imageUrl: sm[2] });
    }
    if (skins.length) heroes.push({ name, skins });
  }
  return heroes;
}

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SkinCut-Sync/1.0 (SortSkin owner sync)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.text();
}

async function downloadFile(url, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(dest, buf);
}

async function pool(items, limit, fn) {
  const queue = [...items];
  const workers = Array.from({ length: limit }, async () => {
    while (queue.length) {
      const item = queue.shift();
      if (item) await fn(item);
    }
  });
  await Promise.all(workers);
}

async function main() {
  const pageUrl = PAGES[game];
  console.log(`โหลด ${pageUrl} ...`);
  const html = await fetchPage(pageUrl);
  const parsed = parseSortskinHtml(html);
  if (!parsed.length) throw new Error('ไม่พบข้อมูลฮีโร่ในหน้า — โครงสร้าง SortSkin อาจเปลี่ยน');

  const slice = parsed.slice(0, heroLimit);
  const assetsRoot = path.join(ROOT, 'public', 'assets', game);
  const catalog = { heroes: [], skins: [] };
  const downloads = [];

  let hueBase = 0;
  for (const h of slice) {
    const heroId = slug(h.name);
    const hero = {
      id: heroId,
      gameId: game,
      name: h.name,
      skinCount: h.skins.length,
      wikiTitle: h.name,
    };
    catalog.heroes.push(hero);

    h.skins.forEach((sk, i) => {
      const ext = extFromUrl(sk.imageUrl);
      const localPath = `/assets/${game}/${heroId}/${i}.${ext}`;
      const dest = path.join(assetsRoot, heroId, `${i}.${ext}`);

      if (!jsonOnly) {
        downloads.push({ url: sk.imageUrl, dest });
      }

      catalog.skins.push({
        id: `${heroId}-skin-${i}`,
        heroId,
        gameId: game,
        name: sk.name,
        tier: TIERS[i % TIERS.length],
        hue: (hueBase + i * 23) % 360,
        imageUrl: jsonOnly ? sk.imageUrl : localPath,
      });
    });
    hueBase = (hueBase + 41) % 360;
  }

  const outJson = path.join(ROOT, 'src', 'data', game, 'catalog.fetched.json');
  await fs.mkdir(path.dirname(outJson), { recursive: true });
  await fs.writeFile(outJson, JSON.stringify(catalog, null, 2) + '\n');

  console.log(
    `✓ catalog → ${path.relative(ROOT, outJson)} (${catalog.heroes.length} ฮีโร่, ${catalog.skins.length} สกิน)`,
  );

  if (jsonOnly) {
    console.log('โหมด json-only — รูปใช้ URL จาก R2 โดยตรง');
    return;
  }

  console.log(`ดาวน์โหลด ${downloads.length} รูป (concurrency ${concurrency}) ...`);
  let done = 0;
  await pool(downloads, concurrency, async ({ url, dest }) => {
    await downloadFile(url, dest);
    done++;
    if (done % 50 === 0 || done === downloads.length) {
      process.stdout.write(`\r  ${done}/${downloads.length}`);
    }
  });
  console.log('\n✓ รูปอยู่ที่ public/assets/' + game);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
