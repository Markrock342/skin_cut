#!/usr/bin/env node
/**
 * อัปเดตคลังสกิน ROV / MLBB จาก SortSkin (ฮีโร่, สกิน, ระดับสกิน, รูป)
 *
 * คำสั่งหลัก (แนะนำทุกเดือน):
 *   npm run sync:sortskin          # ทั้งสองเกม, รูปจาก R2 (~1 นาที)
 *
 * รายเกม:
 *   npm run sync:sortskin:rov:json
 *   npm run sync:sortskin:mlbb:json
 *
 * โหลดรูปลงเครื่อง (ช้า, ใช้เมื่อ deploy แบบไม่พึ่ง R2):
 *   npm run sync:sortskin:local
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

const GAMES = ['rov', 'mlbb'];

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  }),
);

if (args.help === 'true' || args.h === 'true') {
  console.log(`Usage:
  node scripts/sync-sortskin-catalog.mjs [--game=rov|mlbb|all] [--json-only] [--heroes=N]

  npm run sync:sortskin              # all games + json-only (แนะนำ)
  npm run sync:sortskin:local        # all games + download images
`);
  process.exit(0);
}

const gameArg = args.game ?? 'rov';
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

function inferTierFromSkinName(name) {
  const n = name.toLowerCase();
  if (/\bcollector\b/.test(n)) return 'limited';
  if (/\blegend\b/.test(n)) return 'limited';
  if (/\b(mythic|myth)\b/.test(n)) return 'mythic';
  if (/\b(ultimate|supreme|zenith|prime)\b/.test(n)) return 'ultimate';
  if (/\bepic\b/.test(n)) return 'epic';
  if (/\belite\b/.test(n)) return 'elite';
  if (/\b(limited|collab)\b/.test(n)) return 'limited';
  return 'normal';
}

function inferTierFromCollection(collectionName) {
  const c = collectionName.toLowerCase().trim();
  if (c === 'legend' || c === 'collector' || c === 'limited') return 'limited';
  if (c.includes('myth')) return 'mythic';
  if (c === 'epic') return 'epic';
  if (c === 'elite') return 'elite';
  if (c === 'basic' || c === 'special' || c === 'star') return 'normal';
  if (['dimension breaker', 'evo', 'eternal', 'divine', 'infinity'].some((k) => c.includes(k))) {
    return 'ultimate';
  }
  return null;
}

function tierFromSkin(name, collectionName) {
  return inferTierFromCollection(collectionName) ?? inferTierFromSkinName(name);
}

function parseHeroes(html) {
  const re =
    /\\"name\\":\\"([^"\\]+)\\",\\"createdAt\\":[^,]+,\\"skins\\":\[([\s\S]*?)\]\}/g;
  const heroes = [];
  let m;
  while ((m = re.exec(html))) {
    const name = m[1];
    const skinsRaw = m[2];
    const skinRe =
      /\\"id\\":\\"([^"\\]+)\\",\\"heroId\\":\\"[^"\\]+\\",\\"name\\":\\"([^"\\]+)\\",\\"imageUrl\\":\\"(https:[^"\\]+)\\"/g;
    const skins = [];
    let sm;
    while ((sm = skinRe.exec(skinsRaw))) {
      skins.push({ sortskinId: sm[1], name: sm[2], imageUrl: sm[3] });
    }
    if (skins.length) heroes.push({ name, skins });
  }
  return heroes;
}

function parseCollections(html) {
  const collRe =
    /\\"name\\":\\"([^"\\]+)\\",\\"order\\":(\d+),\\"createdAt\\":[^,]+,\\"updatedAt\\":[^,]+,\\"items\\":\[([\s\S]*?)\]\}/g;
  const collections = [];
  let m;
  while ((m = collRe.exec(html))) {
    const itemsRaw = m[3];
    const skinRe = /\\"skin\\":\{\\"id\\":\\"([^"\\]+)\\"/g;
    const skinIds = [];
    let sm;
    while ((sm = skinRe.exec(itemsRaw))) {
      skinIds.push(sm[1]);
    }
    if (skinIds.length) {
      collections.push({ name: m[1], order: Number(m[2]), skinIds });
    }
  }
  return collections;
}

/** ชื่อชั้นสกินซ้ำจาก SortSkin → slug id ซ้ำ — รวม skinIds */
function mergeCollectionsById(collections) {
  const byId = new Map();
  for (const c of collections) {
    const cur = byId.get(c.id);
    if (!cur) {
      byId.set(c.id, { ...c, skinIds: [...c.skinIds] });
      continue;
    }
    const seen = new Set(cur.skinIds);
    for (const sid of c.skinIds) {
      if (!seen.has(sid)) {
        seen.add(sid);
        cur.skinIds.push(sid);
      }
    }
    cur.skinCount = cur.skinIds.length;
    cur.order = Math.min(cur.order, c.order);
    if (!String(cur.name || '').trim() && String(c.name || '').trim()) cur.name = c.name;
  }
  return [...byId.values()].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SkinCut-Sync/1.0 (SortSkin catalog sync)' },
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

async function readPreviousCatalog(outJson) {
  try {
    const raw = await fs.readFile(outJson, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function skinKey(skin) {
  return skin.sortskinId ?? `${skin.heroId}::${skin.name}`;
}

function computeDelta(prev, next) {
  const prevSkins = prev?.skins ?? [];
  const prevByKey = new Map(prevSkins.map((s) => [skinKey(s), s]));
  const nextByKey = new Map(next.skins.map((s) => [skinKey(s), s]));

  const added = next.skins.filter((s) => !prevByKey.has(skinKey(s)));
  const removed = prevSkins.filter((s) => !nextByKey.has(skinKey(s)));
  const prevHeroIds = new Set((prev?.heroes ?? []).map((h) => h.id));
  const newHeroes = next.heroes.filter((h) => !prevHeroIds.has(h.id));

  return { added, removed, newHeroes };
}

/**
 * @param {'rov' | 'mlbb'} game
 * @returns {Promise<{ game: string, heroes: number, skins: number, collections: number, added: number, removed: number, newHeroes: number, addedSamples: string[] }>}
 */
export async function syncCatalog(game, options = {}) {
  const { jsonOnly: localJsonOnly = jsonOnly, heroLimit: limit = heroLimit } = options;
  const pageUrl = PAGES[game];
  console.log(`\n[${game.toUpperCase()}] โหลด ${pageUrl} ...`);
  const html = await fetchPage(pageUrl);
  const parsed = parseHeroes(html).slice(0, limit);
  const collectionsRaw = parseCollections(html);

  if (!parsed.length) {
    throw new Error(`[${game}] ไม่พบข้อมูลฮีโร่ — โครงสร้าง SortSkin อาจเปลี่ยน`);
  }

  const sortskinToLocal = new Map();
  const skinPrimaryCollection = new Map();

  for (const col of collectionsRaw.sort((a, b) => a.order - b.order)) {
    for (const sortskinId of col.skinIds) {
      if (!skinPrimaryCollection.has(sortskinId)) {
        skinPrimaryCollection.set(sortskinId, col.name);
      }
    }
  }

  const assetsRoot = path.join(ROOT, 'public', 'assets', game);
  const catalog = { heroes: [], skins: [], collections: [] };
  const downloads = [];

  let hueBase = 0;
  for (const h of parsed) {
    const heroId = slug(h.name);
    catalog.heroes.push({
      id: heroId,
      gameId: game,
      name: h.name,
      skinCount: h.skins.length,
      wikiTitle: h.name,
    });

    h.skins.forEach((sk, i) => {
      const localSkinId = `${heroId}-skin-${i}`;
      sortskinToLocal.set(sk.sortskinId, localSkinId);

      const ext = extFromUrl(sk.imageUrl);
      const localPath = `/assets/${game}/${heroId}/${i}.${ext}`;
      const dest = path.join(assetsRoot, heroId, `${i}.${ext}`);
      const collection = skinPrimaryCollection.get(sk.sortskinId);

      if (!localJsonOnly) {
        downloads.push({ url: sk.imageUrl, dest });
      }

      catalog.skins.push({
        id: localSkinId,
        sortskinId: sk.sortskinId,
        heroId,
        gameId: game,
        name: sk.name,
        tier: tierFromSkin(sk.name, collection ?? ''),
        hue: (hueBase + i * 23) % 360,
        imageUrl: localJsonOnly ? sk.imageUrl : localPath,
        ...(collection ? { collection } : {}),
      });
    });
    hueBase = (hueBase + 41) % 360;
  }

  for (const col of collectionsRaw.sort((a, b) => a.order - b.order)) {
    const colId = slug(col.name) || `collection-${col.order}`;
    const skinIds = col.skinIds.map((sid) => sortskinToLocal.get(sid)).filter(Boolean);
    if (!skinIds.length) continue;
    catalog.collections.push({
      id: colId,
      name: col.name,
      order: col.order,
      skinCount: skinIds.length,
      skinIds,
    });
  }

  catalog.collections = mergeCollectionsById(catalog.collections);

  const outJson = path.join(ROOT, 'src', 'data', game, 'catalog.fetched.json');
  const prev = await readPreviousCatalog(outJson);
  const delta = computeDelta(prev, catalog);

  await fs.mkdir(path.dirname(outJson), { recursive: true });
  await fs.writeFile(outJson, JSON.stringify(catalog, null, 2) + '\n');

  console.log(
    `  ✓ ${path.relative(ROOT, outJson)} — ${catalog.heroes.length} ฮีโร่, ${catalog.skins.length} สกิน, ${catalog.collections.length} ระดับสกิน`,
  );

  if (delta.added.length || delta.removed.length || delta.newHeroes.length) {
    console.log(
      `  Δ +${delta.added.length} สกิน, -${delta.removed.length} สกิน, +${delta.newHeroes.length} ฮีโร่ใหม่`,
    );
    if (delta.added.length) {
      const samples = delta.added.slice(0, 8).map((s) => s.name);
      console.log(`    สกินใหม่: ${samples.join(', ')}${delta.added.length > 8 ? ' …' : ''}`);
    }
    if (delta.newHeroes.length) {
      console.log(`    ฮีโร่ใหม่: ${delta.newHeroes.map((h) => h.name).join(', ')}`);
    }
  } else if (prev) {
    console.log('  Δ ไม่มีสกิน/ฮีโร่ใหม่ (จำนวนเท่าเดิม)');
  }

  if (!localJsonOnly && downloads.length) {
    console.log(`  ดาวน์โหลด ${downloads.length} รูป ...`);
    let done = 0;
    await pool(downloads, concurrency, async ({ url, dest }) => {
      await downloadFile(url, dest);
      done++;
      if (done % 50 === 0 || done === downloads.length) {
        process.stdout.write(`\r  ${done}/${downloads.length}`);
      }
    });
    console.log(`\n  ✓ รูปที่ public/assets/${game}`);
  } else if (localJsonOnly) {
    console.log('  รูปใช้ URL จาก SortSkin R2 (json-only)');
  }

  return {
    game,
    heroes: catalog.heroes.length,
    skins: catalog.skins.length,
    collections: catalog.collections.length,
    added: delta.added.length,
    removed: delta.removed.length,
    newHeroes: delta.newHeroes.length,
  };
}

async function main() {
  const targets =
    gameArg === 'all' ? GAMES : gameArg === 'mlbb' ? ['mlbb'] : gameArg === 'rov' ? ['rov'] : null;

  if (!targets) {
    console.error(`เกมไม่รู้จัก: ${gameArg} (ใช้ rov, mlbb, หรือ all)`);
    process.exit(1);
  }

  console.log(
    `SortSkin catalog sync — ${targets.join(' + ')}${jsonOnly ? ' (json-only)' : ' (download images)'}`,
  );

  const results = [];
  for (const g of targets) {
    results.push(await syncCatalog(g));
  }

  if (results.length > 1) {
    console.log('\n── สรุป ──');
    for (const r of results) {
      console.log(
        `  ${r.game.toUpperCase()}: ${r.skins} สกิน (+${r.added}/-${r.removed}), ${r.collections} ระดับสกิน`,
      );
    }
    console.log('\nเสร็จ — restart dev server หรือ build ใหม่เพื่อเห็นในหน้าเว็บ');
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
