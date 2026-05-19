import { ARENA_POSTER_COST } from '../config/arena-pricing';
import { COMPOSE_POSTER_COST_DEFAULT } from '../config/compose-pricing';
import { calcStudioCost, formatStudioCost, STUDIO_MIN_SKINS } from '../config/studio-pricing';
import { requireSupabase } from './supabase';

export class InsufficientCoinsError extends Error {
  readonly required: number;

  constructor(required: number) {
    super('คอยน์ไม่พอ');
    this.name = 'InsufficientCoinsError';
    this.required = required;
  }
}

export class StudioMinSkinsError extends Error {
  constructor() {
    super(`เลือกอย่างน้อย ${STUDIO_MIN_SKINS} สกิน`);
    this.name = 'StudioMinSkinsError';
  }
}

export class StudioAuthRequiredError extends Error {
  constructor() {
    super('กรุณาเข้าสู่ระบบก่อนสร้างภาพ');
    this.name = 'StudioAuthRequiredError';
  }
}

export interface ChargeStudioPosterResult {
  coins: number;
  charged: number;
}

export type ChargeArenaPosterResult = ChargeStudioPosterResult;
export type ChargeComposePosterResult = ChargeStudioPosterResult;

export function formatStudioChargeError(error: unknown): string {
  if (error instanceof StudioAuthRequiredError) {
    return 'กรุณาเข้าสู่ระบบก่อนสร้างภาพ';
  }
  if (error instanceof InsufficientCoinsError) {
    return `คอยน์ไม่พอ — ต้องการ ${formatStudioCost(error.required)} คอยน์`;
  }
  if (error instanceof StudioMinSkinsError) {
    return error.message;
  }

  const msg =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error);

  if (msg.includes('not_authenticated')) return 'กรุณาเข้าสู่ระบบก่อนสร้างภาพ';
  if (msg.includes('insufficient_coins')) return 'คอยน์ไม่พอ';
  if (msg.includes('min_skins_required')) return `เลือกอย่างน้อย ${STUDIO_MIN_SKINS} สกิน`;

  if (
    msg.includes('charge_studio_poster') ||
    msg.includes('charge_arena_poster') ||
    msg.includes('charge_compose_poster') ||
    msg.includes('PGRST202') ||
    msg.includes('Could not find the function')
  ) {
    return 'ระบบหักคอยน์ยังไม่พร้อม — รัน migration บน Supabase (npm run db:migrate)';
  }

  return msg || 'หักคอยน์ไม่สำเร็จ';
}

export async function chargeStudioPoster(
  title: string,
  skinCount: number,
): Promise<ChargeStudioPosterResult> {
  if (skinCount < STUDIO_MIN_SKINS) {
    throw new StudioMinSkinsError();
  }

  const expectedCost = calcStudioCost(skinCount);
  const supabase = requireSupabase();

  await supabase.rpc('ensure_my_profile').then(({ error }) => {
    if (error && !error.message.includes('Could not find the function')) {
      console.warn('ensure_my_profile:', error.message);
    }
  });

  const { data, error } = await supabase.rpc('charge_studio_poster', {
    p_title: title,
    p_skin_count: skinCount,
  });

  if (error) {
    const msg = error.message ?? '';
    if (msg.includes('not_authenticated')) {
      throw new StudioAuthRequiredError();
    }
    if (msg.includes('min_skins_required')) {
      throw new StudioMinSkinsError();
    }
    if (msg.includes('insufficient_coins')) {
      throw new InsufficientCoinsError(expectedCost);
    }
    throw new Error(msg);
  }

  const row = data as { coins?: number; charged?: number } | null;
  return {
    coins: Number(row?.coins ?? 0),
    charged: Number(row?.charged ?? expectedCost),
  };
}

export async function chargeArenaPoster(title: string): Promise<ChargeArenaPosterResult> {
  const expectedCost = ARENA_POSTER_COST;
  const supabase = requireSupabase();

  await supabase.rpc('ensure_my_profile').then(({ error }) => {
    if (error && !error.message.includes('Could not find the function')) {
      console.warn('ensure_my_profile:', error.message);
    }
  });

  const { data, error } = await supabase.rpc('charge_arena_poster', {
    p_title: title,
  });

  if (error) {
    const msg = error.message ?? '';
    if (msg.includes('not_authenticated')) {
      throw new StudioAuthRequiredError();
    }
    if (msg.includes('insufficient_coins')) {
      throw new InsufficientCoinsError(expectedCost);
    }
    throw new Error(msg);
  }

  const row = data as { coins?: number; charged?: number } | null;
  return {
    coins: Number(row?.coins ?? 0),
    charged: Number(row?.charged ?? expectedCost),
  };
}

export async function chargeComposePoster(title: string): Promise<ChargeComposePosterResult> {
  const expectedCost = COMPOSE_POSTER_COST_DEFAULT;
  const supabase = requireSupabase();

  await supabase.rpc('ensure_my_profile').then(({ error }) => {
    if (error && !error.message.includes('Could not find the function')) {
      console.warn('ensure_my_profile:', error.message);
    }
  });

  const { data, error } = await supabase.rpc('charge_compose_poster', {
    p_title: title,
  });

  if (error) {
    const msg = error.message ?? '';
    if (msg.includes('not_authenticated')) {
      throw new StudioAuthRequiredError();
    }
    if (msg.includes('insufficient_coins')) {
      throw new InsufficientCoinsError(expectedCost);
    }
    throw new Error(msg);
  }

  const row = data as { coins?: number; charged?: number } | null;
  return {
    coins: Number(row?.coins ?? 0),
    charged: Number(row?.charged ?? expectedCost),
  };
}
