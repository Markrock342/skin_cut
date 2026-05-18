import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'ตั้งค่า VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY ในไฟล์ .env ก่อนรันแอป',
  );
}

export const supabase = createClient(url, anonKey);

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
