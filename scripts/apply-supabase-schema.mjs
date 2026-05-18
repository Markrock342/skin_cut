/**
 * รัน SQL migration บน Supabase
 *
 * วิธีที่ 1 (แนะนำ): Personal Access Token
 *   https://supabase.com/dashboard/account/tokens → สร้าง token
 *   ใส่ใน .env: SUPABASE_ACCESS_TOKEN=sbp_...
 *
 * วิธีที่ 2: รหัสผ่าน Postgres โดยตรง
 *   Dashboard → Project Settings → Database → Database password
 *   ใส่ใน .env: SUPABASE_DB_PASSWORD=...
 *
 * ใช้งาน:
 *   node scripts/apply-supabase-schema.mjs          # รัน 001 แล้ว 002
 *   node scripts/apply-supabase-schema.mjs 002      # เฉพาะ 002
 *   node scripts/apply-supabase-schema.mjs 001 002
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvFile(path.join(root, '.env'));
loadEnvFile(path.join(root, '.env.local'));

const migrationsDir = path.join(root, 'supabase/migrations');
const available = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const extraSqlDir = path.join(root, 'supabase');
const extraFiles = fs.existsSync(extraSqlDir)
  ? fs
      .readdirSync(extraSqlDir)
      .filter((f) => f.endsWith('.sql') && !f.startsWith('000_'))
      .map((f) => ({ file: f, abs: path.join(extraSqlDir, f), isMigration: false }))
  : [];

const args = process.argv.slice(2).filter((a) => !a.startsWith('-'));

function resolveTarget(id) {
  if (id.endsWith('.sql')) {
    const abs = path.isAbsolute(id) ? id : path.join(root, id);
    if (fs.existsSync(abs)) return { file: path.basename(abs), abs, isMigration: false };
    const inSupabase = path.join(extraSqlDir, id);
    if (fs.existsSync(inSupabase)) return { file: id, abs: inSupabase, isMigration: false };
  }
  const byName = extraFiles.find((x) => x.file.includes(id));
  if (byName) return byName;
  const mig = available.find((f) => f.startsWith(`${id}_`) || f === `${id}.sql`);
  if (mig) return { file: mig, abs: path.join(migrationsDir, mig), isMigration: true };
  return null;
}

const targets =
  args.length > 0
    ? args.map((id) => {
        const resolved = resolveTarget(id);
        if (!resolved) {
          console.error(`ไม่พบ SQL: ${id}`);
          console.error('migration:', available.join(', '));
          console.error('supabase/:', extraFiles.map((x) => x.file).join(', ') || '(none)');
          process.exit(1);
        }
        return resolved;
      })
    : available.map((file) => ({
        file,
        abs: path.join(migrationsDir, file),
        isMigration: true,
      }));

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!url) {
  console.error('ไม่พบ VITE_SUPABASE_URL ใน .env');
  process.exit(1);
}

const projectRef = new URL(url).hostname.split('.')[0];

async function runViaManagementApi(sql, label) {
  if (!accessToken) return { ok: false, skipped: true };
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) {
    return { ok: false, error: `${label}: HTTP ${res.status} ${text.slice(0, 400)}` };
  }
  return { ok: true, body: text };
}

function runViaPsql(sql, label) {
  if (!dbPassword) return { ok: false, skipped: true };
  const host = `db.${projectRef}.supabase.co`;
  const result = spawnSync(
    'psql',
    [
      '-h',
      host,
      '-p',
      '5432',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      sql,
    ],
    {
      env: { ...process.env, PGPASSWORD: dbPassword },
      encoding: 'utf8',
    },
  );
  if (result.status !== 0) {
    return {
      ok: false,
      error: `${label}: psql exit ${result.status}\n${result.stderr || result.stdout}`,
    };
  }
  return { ok: true, body: result.stdout };
}

async function runMigration(target) {
  const sqlPath = target.abs ?? path.join(migrationsDir, target.file ?? target);
  const label = target.file ?? target;
  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log(`\n→ ${label}`);

  const api = await runViaManagementApi(sql, 'Management API');
  if (api.ok) {
    console.log('  ✓ สำเร็จ (Management API)');
    return true;
  }
  if (!api.skipped) {
    console.warn('  Management API:', api.error);
  }

  const psql = runViaPsql(sql, 'psql');
  if (psql.ok) {
    console.log('  ✓ สำเร็จ (psql)');
    return true;
  }
  if (!psql.skipped) {
    console.warn('  psql:', psql.error);
  }

  return false;
}

async function main() {
  console.log(`โปรเจกต์: ${projectRef}`);
  console.log(`SQL: ${targets.map((t) => t.file).join(', ')}`);

  if (!accessToken && !dbPassword) {
    console.error(`
ไม่มี credentials สำหรับรัน SQL — เพิ่มอย่างใดอย่างหนึ่งใน .env:

  SUPABASE_ACCESS_TOKEN=sbp_...     ← จาก supabase.com/dashboard/account/tokens
  หรือ
  SUPABASE_DB_PASSWORD=...          ← จาก Project Settings → Database

แล้วรัน:  npm run db:migrate
`);
    process.exit(1);
  }

  let failed = false;
  for (const file of targets) {
    const ok = await runMigration(file);
    if (!ok) failed = true;
  }

  if (failed) {
    console.error('\n✗ บาง migration ไม่สำเร็จ — ลองรัน SQL ใน Dashboard → SQL Editor');
    process.exit(1);
  }

  console.log('\n✓ Migration ครบแล้ว');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
