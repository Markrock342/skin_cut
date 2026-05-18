import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

export const isSupabaseConfigured = Boolean(url && anonKey);

export const SUPABASE_SETUP_MESSAGE =
  'บัญชีและคอยน์ยังไม่พร้อมบนเซิร์ฟเวอร์นี้ — ตั้งค่า VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY แล้ว build ใหม่';

let client: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  client = createClient(url, anonKey);
}

export function getSupabase(): SupabaseClient | null {
  return client;
}

export function requireSupabase(): SupabaseClient {
  if (!client) {
    throw new Error(SUPABASE_SETUP_MESSAGE);
  }
  return client;
}

export type ProfileRow = {
  id: string;
  display_name: string;
  coins: number;
  created_at: string;
  email?: string | null;
  is_admin?: boolean;
  terms_accepted_at?: string | null;
  terms_version?: string | null;
};

export type ActivityHistoryRow = {
  id: string;
  user_id: string;
  title: string;
  kind: 'studio' | 'topup';
  status: 'done' | 'pending' | 'failed';
  created_at: string;
};
