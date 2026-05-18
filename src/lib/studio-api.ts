import { calcStudioCost, STUDIO_MIN_SKINS } from '../config/studio-pricing';
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

export async function chargeStudioPoster(
  title: string,
  skinCount: number,
): Promise<ChargeStudioPosterResult> {
  if (skinCount < STUDIO_MIN_SKINS) {
    throw new StudioMinSkinsError();
  }

  const expectedCost = calcStudioCost(skinCount);

  const { data, error } = await requireSupabase().rpc('charge_studio_poster', {
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
    throw new Error(error.message);
  }

  const row = data as { coins?: number; charged?: number } | null;
  return {
    coins: Number(row?.coins ?? 0),
    charged: Number(row?.charged ?? expectedCost),
  };
}
