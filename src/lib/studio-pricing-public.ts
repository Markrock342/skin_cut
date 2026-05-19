import { ARENA_POSTER_COST } from '../config/arena-pricing';
import { COMPOSE_POSTER_COST_DEFAULT } from '../config/compose-pricing';
import { getSupabase } from './supabase';

export interface StudioPricing {
  arenaPosterCost: number;
  composePosterCost: number;
}

const FALLBACK: StudioPricing = {
  arenaPosterCost: ARENA_POSTER_COST,
  composePosterCost: COMPOSE_POSTER_COST_DEFAULT,
};

export async function fetchStudioPricing(): Promise<StudioPricing> {
  const supabase = getSupabase();
  if (!supabase) return FALLBACK;

  const { data, error } = await supabase.rpc('get_studio_pricing');
  if (error || !data) return FALLBACK;

  const row = data as {
    arena_poster_cost?: number;
    compose_poster_cost?: number;
  };

  return {
    arenaPosterCost: Number(row.arena_poster_cost ?? FALLBACK.arenaPosterCost),
    composePosterCost: Number(row.compose_poster_cost ?? FALLBACK.composePosterCost),
  };
}
