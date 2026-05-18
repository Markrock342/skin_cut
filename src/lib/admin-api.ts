import type {
  AdminHistoryRow,
  AdminProfile,
  AdminStats,
  ContactMessage,
  SiteSettingKey,
  SiteSettings,
} from '../types/admin';
import { requireSupabase } from './supabase';

function mapProfile(row: Record<string, unknown>): AdminProfile {
  return {
    id: String(row.id),
    email: row.email != null ? String(row.email) : null,
    displayName: String(row.display_name),
    coins: Number(row.coins),
    isAdmin: Boolean(row.is_admin),
    termsAcceptedAt: row.terms_accepted_at ? String(row.terms_accepted_at) : null,
    termsVersion: row.terms_version ? String(row.terms_version) : null,
    createdAt: String(row.created_at),
  };
}

function mapContact(row: Record<string, unknown>): ContactMessage {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    category: row.category as ContactMessage['category'],
    subject: String(row.subject),
    message: String(row.message),
    status: row.status as ContactMessage['status'],
    adminNote: row.admin_note != null ? String(row.admin_note) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at ?? row.created_at),
  };
}

function adminError(error: { message?: string; code?: string }): never {
  const msg = error.message ?? 'เกิดข้อผิดพลาด';
  if (msg.includes('forbidden') || error.code === '42501') {
    throw new Error('ไม่มีสิทธิ์แอดมิน — ตั้ง is_admin ใน Supabase หรือ VITE_ADMIN_EMAILS');
  }
  if (error.code === 'PGRST202' || msg.includes('admin_dashboard_stats')) {
    throw new Error('รัน SQL: supabase/migrations/003_admin.sql');
  }
  throw new Error(msg);
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const { data, error } = await requireSupabase().rpc('admin_dashboard_stats');
  if (error) adminError(error);
  return data as AdminStats;
}

export async function fetchAdminProfiles(): Promise<AdminProfile[]> {
  const { data, error } = await requireSupabase()
    .from('profiles')
    .select(
      'id, email, display_name, coins, is_admin, terms_accepted_at, terms_version, created_at',
    )
    .order('created_at', { ascending: false });

  if (error) adminError(error);
  return (data ?? []).map((r) => mapProfile(r as Record<string, unknown>));
}

export async function updateProfileAdmin(
  userId: string,
  patch: { displayName?: string; coins?: number; isAdmin?: boolean },
): Promise<void> {
  const body: Record<string, unknown> = {};
  if (patch.displayName != null) body.display_name = patch.displayName.trim();
  if (patch.coins != null) body.coins = Math.max(0, patch.coins);
  if (patch.isAdmin != null) body.is_admin = patch.isAdmin;

  const { error } = await requireSupabase().from('profiles').update(body).eq('id', userId);
  if (error) adminError(error);
}

export async function adjustUserCoins(
  userId: string,
  delta: number,
  reason?: string,
): Promise<number> {
  const { data, error } = await requireSupabase().rpc('admin_adjust_coins', {
    p_user_id: userId,
    p_delta: delta,
    p_reason: reason ?? null,
  });
  if (error) adminError(error);
  return Number(data);
}

export async function fetchAdminHistory(limit = 100): Promise<AdminHistoryRow[]> {
  const { data, error } = await requireSupabase()
    .from('activity_history')
    .select('id, user_id, title, kind, status, created_at, profiles(display_name)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) adminError(error);

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const profile = r.profiles as { display_name?: string } | null;
    return {
      id: String(r.id),
      userId: String(r.user_id),
      userDisplayName: profile?.display_name ?? null,
      title: String(r.title),
      kind: r.kind as AdminHistoryRow['kind'],
      status: r.status as AdminHistoryRow['status'],
      createdAt: String(r.created_at),
    };
  });
}

export async function updateHistoryStatus(
  id: string,
  status: AdminHistoryRow['status'],
): Promise<void> {
  const { error } = await requireSupabase().from('activity_history').update({ status }).eq('id', id);
  if (error) adminError(error);
}

export async function fetchContactMessages(): Promise<ContactMessage[]> {
  const { data, error } = await requireSupabase()
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) adminError(error);
  return (data ?? []).map((r) => mapContact(r as Record<string, unknown>));
}

export async function updateContactMessage(
  id: string,
  patch: { status?: ContactMessage['status']; adminNote?: string },
): Promise<void> {
  const body: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status) body.status = patch.status;
  if (patch.adminNote !== undefined) body.admin_note = patch.adminNote;

  const { error } = await requireSupabase().from('contact_messages').update(body).eq('id', id);
  if (error) adminError(error);
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await requireSupabase().from('site_settings').select('key, value');
  if (error) adminError(error);

  const out: SiteSettings = {
    maintenance_mode: false,
    signup_bonus_coins: 50,
    announcement: '',
  };

  for (const row of data ?? []) {
    const k = row.key as SiteSettingKey;
    if (k in out) out[k] = row.value;
  }
  return out;
}

export async function updateSiteSetting(key: SiteSettingKey, value: unknown): Promise<void> {
  const { error } = await requireSupabase()
    .from('site_settings')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key);
  if (error) adminError(error);
}

export const CONTACT_CATEGORY_LABEL: Record<ContactMessage['category'], string> = {
  general: 'ทั่วไป',
  billing: 'การชำระเงิน',
  privacy: 'ความเป็นส่วนตัว',
  ip: 'ลิขสิทธิ์',
  bug: 'รายงานบั๊ก',
};

export const CONTACT_STATUS_LABEL: Record<ContactMessage['status'], string> = {
  new: 'ใหม่',
  read: 'อ่านแล้ว',
  replied: 'ตอบแล้ว',
  archived: 'เก็บถาวร',
};
