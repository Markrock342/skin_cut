#!/usr/bin/env node
/**
 * ดึงเฉพาะ URL รูปจาก Fandom Wiki (fan wiki) แล้วบันทึกลง public/assets
 * ใช้: node scripts/fetch-skin-images.mjs [--game=rov|mlbb] [--limit=10]
 *
 * ไม่ scrape เว็บขายไอดี — แหล่งรูป: community wiki API เท่านั้น
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'public', 'assets');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  }),
);

const game = args.game === 'mlbb' ? 'mlbb' : 'rov';
const limit = Number(args.limit ?? 10);

const WIKI = {
  rov: {
    host: 'arenaofvalor.fandom.com',
    heroes: [
      { id: 'airi', name: 'Airi', wikiTitle: 'Airi' },
      { id: 'aleister', name: 'Aleister', wikiTitle: 'Aleister' },
      { id: 'alice', name: 'Alice', wikiTitle: 'Alice' },
      { id: 'angela', name: 'Angela', wikiTitle: 'Angela' },
      { id: 'butterfly', name: 'Butterfly', wikiTitle: 'Butterfly' },
      { id: 'elsu', name: 'Elsu', wikiTitle: 'Elsu' },
      { id: 'liliana', name: 'Liliana', wikiTitle: 'Liliana' },
      { id: 'nakroth', name: 'Nakroth', wikiTitle: 'Nakroth' },
      { id: 'raz', name: 'Raz', wikiTitle: 'Raz' },
      { id: 'yena', name: 'Yena', wikiTitle: 'Yena' },
    ],
  },
  mlbb: {
    host: 'mobile-legends.fandom.com',
    heroes: [
      { id: 'layla', name: 'Layla', wikiTitle: 'Layla' },
      { id: 'miya', name: 'Miya', wikiTitle: 'Miya' },
      { id: 'gusion', name: 'Gusion', wikiTitle: 'Gusion' },
      { id: 'fanny', name: 'Fanny', wikiTitle: 'Fanny' },
      { id: 'angela', name: 'Angela', wikiTitle: 'Angela' },
      { id: 'lancelot', name: 'Lancelot', wikiTitle: 'Lancelot' },
      { id: 'chou', name: 'Chou', wikiTitle: 'Chou' },
      { id: 'kagura', name: 'Kagura', wikiTitle: 'Kagura' },
      { id: 'harith', name: 'Harith', wikiTitle: 'Harith' },
      { id: 'wanwan', name: 'Wanwan', wikiTitle: 'Wanwan' },
    ],
  },
};

const SKIP_PATTERN =
  /logo|icon|wiki|site-|button|banner|edit|avatar|stub|navigation|wordmark|emoji/i;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function wikiApi(host, params) {
  const url = `https://${host}/api.php?${new URLSearchParams({ format: 'json', origin: '*', ...params })}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SkinCut-Asset-Fetcher/1.0 (fan tool; images only)' },
  });
  if (!res.ok) throw new Error(`Wiki API ${res.status}: ${url}`);
  return res.json();
}

async function listPageImages(host, title) {
  const data = await wikiApi(host, {
    action: 'query',
    titles: title,
    prop: 'images',
    imlimit: 'max',
  });
  const pages = data.query?.pages ?? {};
  const page = Object.values(pages)[0];
  if (!page || page.missing !== undefined) return [];
  return (page.images ?? []).map((i) => i.title).filter((t) => !SKIP_PATTERN.test(t));
}

async function resolveImageUrl(host, fileTitle) {
  const data = await wikiApi(host, {
    action: 'query',
    titles: fileTitle,
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: '480',
  });
  const pages = data.query?.pages ?? {};
  const page = Object.values(pages)[0];
  const info = page?.imageinfo?.[0];
  return info?.thumburl || info?.url || null;
}

async function downloadFile(url, dest) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SkinCut-Asset-Fetcher/1.0' },
  });
  if (!res.ok) throw new Error(`Download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buf);
}

async function processHero(host, hero, maxSkins = 12) {
  console.log(`\n→ ${hero.name} (${hero.wikiTitle})`);
  const files = await listPageImages(host, hero.wikiTitle);
  const picked = files.slice(0, maxSkins * 2);
  const skins = [];

  for (const fileTitle of picked) {
    if (skins.length >= maxSkins) break;
    await sleep(350);
    try {
      const url = await resolveImageUrl(host, fileTitle);
      if (!url) continue;
      const ext = path.extname(new URL(url).pathname) || '.jpg';
      const idx = skins.length;
      const rel = `/assets/${game}/${hero.id}/${idx}${ext}`;
      const dest = path.join(ASSETS, game, hero.id, `${idx}${ext}`);
      await downloadFile(url, dest);
      const label = fileTitle
        .replace(/^File:/i, '')
        .replace(/\.[a-z]+$/i, '')
        .replace(/_/g, ' ')
        .slice(0, 48);
      skins.push({
        id: `${hero.id}-skin-${idx}`,
        heroId: hero.id,
        gameId: game,
        name: label,
        tier: ['limited', 'ultimate', 'mythic', 'epic', 'elite', 'normal'][idx % 6],
        hue: (hero.id.length * 37 + idx * 23) % 360,
        imageUrl: rel,
      });
      console.log(`  ✓ ${rel}`);
    } catch (e) {
      console.warn(`  skip ${fileTitle}: ${e.message}`);
    }
  }

  return {
    hero: {
      id: hero.id,
      gameId: game,
      name: hero.name,
      skinCount: skins.length,
      wikiTitle: hero.wikiTitle,
    },
    skins,
  };
}

async function main() {
  const cfg = WIKI[game];
  const heroes = cfg.heroes.slice(0, limit);
  const catalog = { heroes: [], skins: [] };

  console.log(`Fetching ${game} — ${heroes.length} heroes from ${cfg.host}`);

  for (const hero of heroes) {
    await sleep(500);
    const result = await processHero(cfg.host, hero);
    if (result.skins.length === 0) {
      console.warn(`  ! no images for ${hero.name}`);
      continue;
    }
    catalog.heroes.push(result.hero);
    catalog.skins.push(...result.skins);
  }

  const outPath = path.join(ROOT, 'src', 'data', game, 'catalog.fetched.json');
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(catalog, null, 2));
  console.log(`\nWrote ${outPath} (${catalog.skins.length} skins)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
