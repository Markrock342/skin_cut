import type { PostgrestSingleResponse, User } from '@supabase/supabase-js';
import { TERMS_VERSION } from '../content/legal';
import type { RegisterOutcome } from './auth-types';
import type { AuthUser } from '../types/auth';
import { getBootstrapAdminEmails, resolveIsAdmin } from './admin-access';
import { type ProfileRow, requireSupabase } from './supabase';

function mapProfile(row: ProfileRow, email: string): AuthUser {
  const user: AuthUser = {
    id: row.id,
    email: row.email ?? email,
    displayName: row.display_name,
    coins: row.coins,
    createdAt: row.created_at,
    isAdmin: Boolean(row.is_admin),
  };
  return { ...user, isAdmin: resolveIsAdmin(user) };
}

function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials') || m.includes('invalid grant')) {
    return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
  }
  if (m.includes('user already registered')) return 'อีเมลนี้ถูกใช้งานแล้ว';
  if (m.includes('password')) return 'รหัสผ่านไม่ตรงตามเงื่อนไข (อย่างน้อย 8 ตัวอักษร)';
  if (m.includes('email not confirmed') || m.includes('email_not_confirmed')) {
    return 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ — เปิดลิงก์ในกล่องจดหมาย หรือกดส่งอีเมลยืนยันอีกครั้ง';
  }
  if (m.includes('rate limit')) return 'ลองใหม่อีกครั้งในสักครู่';
  return message || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
}

export const REQUEST_TIMEOUT_MS = 20_000;

let sessionLoadInflight: Promise<AuthUser> | null = null;
let sessionLoadKey = '';

function timedQuery<T>(label: string, query: PromiseLike<T>): Promise<T> {
  return withTimeout(Promise.resolve(query), label);
}

export function withTimeout<T>(promise: PromiseLike<T>, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} — หมดเวลา ลองใหม่อีกครั้ง`));
    }, REQUEST_TIMEOUT_MS);
    Promise.resolve(promise)
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

export async function ensureMyProfile(): Promise<void> {
  const { error } = await requireSupabase().rpc('ensure_my_profile');
  if (error && !error.message.includes('ensure_my_profile') && error.code !== 'PGRST202') {
    throw new Error(error.message);
  }
}

export async function resendSignupConfirmation(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const { error } = await withTimeout(
    requireSupabase().auth.resend({ type: 'signup', email: normalized }),
    'ส่งอีเมลยืนยัน',
  );
  if (error) throw new Error(mapAuthError(error.message));
}

/** ใช้ metadata จาก session — ห้ามเรียก auth.getUser() ใน onAuthStateChange (deadlock) */
function profileFromAuthUser(authUser: User, email: string): AuthUser {
  const meta = authUser.user_metadata ?? {};
  const user: AuthUser = {
    id: authUser.id,
    email: authUser.email ?? email,
    displayName: String(meta.display_name ?? email.split('@')[0]),
    coins: Number(meta.coins ?? 50),
    createdAt: authUser.created_at ?? new Date().toISOString(),
    isAdmin: Boolean(meta.is_admin),
  };
  return { ...user, isAdmin: resolveIsAdmin(user) };
}

async function fetchProfileOnce(
  userId: string,
  email: string,
  authUser?: User,
): Promise<AuthUser> {
  const { data, error } = await timedQuery(
    'โหลดโปรไฟล์',
    requireSupabase()
      .from('profiles')
      .select('id, display_name, coins, created_at, email, is_admin')
      .eq('id', userId)
      .maybeSingle() as PromiseLike<PostgrestSingleResponse<ProfileRow>>,
  );

  if (!error && data) {
    return mapProfile(data as ProfileRow, email);
  }

  if (
    error?.code === 'PGRST205' ||
    error?.code === 'PGRST116' ||
    error?.message?.includes('schema cache') ||
    !data
  ) {
    await withTimeout(ensureMyProfile(), 'สร้างโปรไฟล์').catch(() => undefined);
    const retry = await timedQuery(
      'โหลดโปรไฟล์',
      requireSupabase()
        .from('profiles')
        .select('id, display_name, coins, created_at, email, is_admin')
        .eq('id', userId)
        .maybeSingle() as PromiseLike<PostgrestSingleResponse<ProfileRow>>,
    );
    if (!retry.error && retry.data) {
      return mapProfile(retry.data as ProfileRow, email);
    }
    if (authUser) return profileFromAuthUser(authUser, email);
  }

  throw new Error('โหลดโปรไฟล์ไม่สำเร็จ');
}

async function loadSessionUserWork(
  userId: string,
  email: string,
  authUser?: User,
): Promise<AuthUser> {
  const profile = await fetchProfileOnce(userId, email, authUser);

  if (
    !profile.isAdmin &&
    getBootstrapAdminEmails().includes(profile.email.toLowerCase())
  ) {
    const claimed = await bootstrapClaimAdmin().catch(() => false);
    if (claimed) {
      return { ...profile, isAdmin: true };
    }
  }

  return profile;
}

/** โหลดโปรไฟล์หลังล็อกอิน — รวม request ซ้ำจาก login + onAuthStateChange */
export function loadSessionUser(
  userId: string,
  email: string,
  authUser?: User,
): Promise<AuthUser> {
  const key = userId;
  if (!sessionLoadInflight || sessionLoadKey !== key) {
    sessionLoadKey = key;
    sessionLoadInflight = loadSessionUserWork(userId, email, authUser).finally(() => {
      sessionLoadInflight = null;
      sessionLoadKey = '';
    });
  }
  return sessionLoadInflight;
}

/** มอบ is_admin ใน DB ให้อีเมลใน bootstrap_admin_emails (site_settings) */
export async function bootstrapClaimAdmin(): Promise<boolean> {
  const { data, error } = await requireSupabase().rpc('bootstrap_claim_admin');
  if (error) {
    if (error.message.includes('bootstrap_claim_admin') || error.code === 'PGRST202') {
      return false;
    }
    throw new Error(error.message);
  }
  return Boolean(data);
}

export async function recordTermsAcceptance(version: string = TERMS_VERSION): Promise<void> {
  const { error } = await requireSupabase().rpc('accept_terms', { p_version: version });
  if (error) {
    if (error.message.includes('accept_terms') || error.code === 'PGRST202') {
      throw new Error(
        'ยังไม่มีฟังก์ชัน accept_terms — รัน supabase/migrations/002_terms_and_contact.sql',
      );
    }
    throw new Error(error.message);
  }
}

export async function register(input: {
  email: string;
  password: string;
  displayName: string;
  acceptTerms: boolean;
  termsVersion?: string;
}): Promise<RegisterOutcome> {
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();
  const termsVersion = input.termsVersion ?? TERMS_VERSION;

  if (!input.acceptTerms) {
    throw new Error('กรุณายอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว');
  }
  if (displayName.length < 2) throw new Error('ชื่อที่แสดงต้องมีอย่างน้อย 2 ตัวอักษร');
  if (input.password.length < 8) throw new Error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');

  const { data, error } = await requireSupabase().auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        display_name: displayName,
        coins: 50,
        terms_version: termsVersion,
      },
    },
  });

  if (error) throw new Error(mapAuthError(error.message));
  if (!data.user) throw new Error('สมัครสมาชิกไม่สำเร็จ');

  if (!data.session) {
    return { kind: 'verify_email', email };
  }

  await new Promise((r) => setTimeout(r, 400));
  await recordTermsAcceptance(termsVersion);
  const user = await loadSessionUser(data.user.id, data.user.email ?? email, data.user);
  return { kind: 'active', user };
}

export async function login(input: { email: string; password: string }): Promise<AuthUser> {
  const email = input.email.trim().toLowerCase();

  const { data, error } = await withTimeout(
    requireSupabase().auth.signInWithPassword({
      email,
      password: input.password,
    }),
    'เข้าสู่ระบบ',
  );

  if (error) {
    const msg = error.message ?? '';
    if (
      msg.toLowerCase().includes('email not confirmed') ||
      msg.toLowerCase().includes('email_not_confirmed')
    ) {
      const err = new Error(mapAuthError(msg));
      err.name = 'EmailNotConfirmed';
      throw err;
    }
    throw new Error(mapAuthError(msg));
  }

  if (!data.user?.email) throw new Error('เข้าสู่ระบบไม่สำเร็จ');

  return loadSessionUser(data.user.id, data.user.email, data.user);
}

export async function logout(): Promise<void> {
  const { error } = await requireSupabase().auth.signOut();
  if (error) throw new Error(mapAuthError(error.message));
}

export async function resolveSessionUser(): Promise<AuthUser | null> {
  const { data, error } = await withTimeout(requireSupabase().auth.getSession(), 'ตรวจสอบเซสชัน');
  if (error) throw new Error(mapAuthError(error.message));

  const session = data.session;
  if (!session?.user?.email) return null;

  return loadSessionUser(session.user.id, session.user.email, session.user);
}
