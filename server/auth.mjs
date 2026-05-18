import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const SECRET = process.env.AUTH_SECRET || 'skincut-dev-secret-change-in-production';
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function usersPath() {
  if (process.env.USERS_FILE) return process.env.USERS_FILE;
  return path.join(process.cwd(), '.data', 'users.json');
}

function ensureStore() {
  const file = usersPath();
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify({ users: [] }, null, 2), 'utf8');
  }
  return file;
}

export function loadUsers() {
  const file = ensureStore();
  try {
    const raw = fs.readFileSync(file, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data.users) ? data.users : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  const file = ensureStore();
  fs.writeFileSync(file, JSON.stringify({ users }, null, 2), 'utf8');
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const next = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(next, 'hex'));
}

function signToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!payload.sub || !payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function createToken(userId) {
  return signToken({ sub: userId, exp: Date.now() + TOKEN_TTL_MS });
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    coins: user.coins ?? 0,
    createdAt: user.createdAt,
  };
}

export function registerUser({ email, password, displayName }) {
  const normalized = normalizeEmail(email);
  const name = String(displayName || '').trim();
  const pass = String(password || '');

  if (!normalized || !normalized.includes('@')) {
    return { ok: false, status: 400, error: 'อีเมลไม่ถูกต้อง' };
  }
  if (pass.length < 8) {
    return { ok: false, status: 400, error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' };
  }
  if (name.length < 2) {
    return { ok: false, status: 400, error: 'ชื่อที่แสดงต้องมีอย่างน้อย 2 ตัวอักษร' };
  }

  const users = loadUsers();
  if (users.some((u) => u.email === normalized)) {
    return { ok: false, status: 409, error: 'อีเมลนี้ถูกใช้งานแล้ว' };
  }

  const user = {
    id: crypto.randomUUID(),
    email: normalized,
    displayName: name,
    passwordHash: hashPassword(pass),
    coins: 50,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);

  const token = createToken(user.id);
  return { ok: true, token, user: publicUser(user) };
}

export function loginUser({ email, password }) {
  const normalized = normalizeEmail(email);
  const pass = String(password || '');

  if (!normalized || !pass) {
    return { ok: false, status: 400, error: 'กรุณากรอกอีเมลและรหัสผ่าน' };
  }

  const users = loadUsers();
  const user = users.find((u) => u.email === normalized);
  if (!user || !verifyPassword(pass, user.passwordHash)) {
    return { ok: false, status: 401, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
  }

  const token = createToken(user.id);
  return { ok: true, token, user: publicUser(user) };
}

export function getUserFromToken(token) {
  const payload = verifyToken(token);
  if (!payload) return { ok: false, status: 401, error: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' };

  const users = loadUsers();
  const user = users.find((u) => u.id === payload.sub);
  if (!user) return { ok: false, status: 401, error: 'ไม่พบบัญชีผู้ใช้' };

  return { ok: true, user: publicUser(user) };
}

export function parseAuthHeader(req) {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (!header || typeof header !== 'string') return null;
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) return null;
  return token;
}
