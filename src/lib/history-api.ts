import type { ActivityHistoryItem } from '../types/auth';
import { withTimeout } from './auth-api';
import type { PostgrestResponse } from '@supabase/supabase-js';
import { type ActivityHistoryRow, requireSupabase } from './supabase';

function mapRow(row: ActivityHistoryRow): ActivityHistoryItem {
  return {
    id: row.id,
    title: row.title,
    kind: row.kind,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function fetchActivityHistory(userId: string): Promise<ActivityHistoryItem[]> {
  const { data, error } = await withTimeout(
    Promise.resolve(
      requireSupabase()
        .from('activity_history')
        .select('id, user_id, title, kind, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50) as PromiseLike<PostgrestResponse<ActivityHistoryRow>>,
    ),
    'โหลดประวัติ',
  );

  if (error) {
    if (error.code === 'PGRST205' || error.message.includes('schema cache')) {
      return [];
    }
    throw new Error(error.message);
  }

  return (data as ActivityHistoryRow[]).map(mapRow);
}

export async function addActivityHistory(
  userId: string,
  item: Pick<ActivityHistoryItem, 'title' | 'kind' | 'status'>,
): Promise<ActivityHistoryItem> {
  const { data, error } = await requireSupabase()
    .from('activity_history')
    .insert({
      user_id: userId,
      title: item.title,
      kind: item.kind,
      status: item.status,
    })
    .select('id, user_id, title, kind, status, created_at')
    .single();

  if (error) throw new Error(error.message);
  return mapRow(data as ActivityHistoryRow);
}
