-- ราคาแบบ SortSkin: สกินละ 0.3 คอยน์ + ยอดคอยน์ทศนิยม

drop function if exists public.charge_studio_poster(text);

insert into public.site_settings (key, value)
values ('studio_coin_per_skin', '0.3'::jsonb)
on conflict (key) do update set value = excluded.value;

-- ลบคีย์ราคาแบบเหมาจำนวน (ถ้ารัน 006 มาแล้ว)
delete from public.site_settings where key = 'studio_poster_cost_cents';

alter table public.profiles
  alter column coins type numeric(12, 2) using coins::numeric(12, 2);

alter table public.profiles
  alter column coins set default 50.00;

create or replace function public.charge_studio_poster(
  p_title text default null,
  p_skin_count integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_per_skin numeric(12, 2);
  v_count integer;
  v_cost numeric(12, 2);
  v_balance numeric(12, 2);
  v_title text;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  v_count := coalesce(nullif(p_skin_count, 0), 0);
  if v_count < 4 then
    raise exception 'min_skins_required';
  end if;

  select coalesce((s.value #>> '{}')::numeric, 0.3)
  into v_per_skin
  from public.site_settings s
  where s.key = 'studio_coin_per_skin';

  v_cost := round(v_count * v_per_skin, 2);

  update public.profiles
  set coins = coins - v_cost
  where id = v_uid
    and coins >= v_cost
  returning coins into v_balance;

  if not found then
    raise exception 'insufficient_coins';
  end if;

  v_title := coalesce(nullif(trim(p_title), ''), 'สร้างโปสเตอร์สกิน');

  insert into public.activity_history (user_id, title, kind, status)
  values (
    v_uid,
    v_title || ' (−' || trim(to_char(v_cost, 'FM999990.00')) || ' คอยน์)',
    'studio',
    'done'
  );

  return jsonb_build_object(
    'coins', v_balance,
    'charged', v_cost,
    'skin_count', v_count,
    'per_skin', v_per_skin
  );
end;
$$;

revoke all on function public.charge_studio_poster(text, integer) from public;
grant execute on function public.charge_studio_poster(text, integer) to authenticated;

-- ปรับ admin_adjust_coins ให้รองรับ numeric
create or replace function public.admin_adjust_coins(
  p_user_id uuid,
  p_delta numeric,
  p_reason text default null
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new numeric(12, 2);
  v_title text;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if p_user_id is null then
    raise exception 'user required';
  end if;

  update public.profiles
  set coins = greatest(0, coins + coalesce(p_delta, 0))
  where id = p_user_id
  returning coins into v_new;

  if not found then
    raise exception 'user not found';
  end if;

  v_title := coalesce(nullif(trim(p_reason), ''), 'ปรับคอยน์โดยแอดมิน (' || coalesce(p_delta, 0)::text || ')');

  insert into public.activity_history (user_id, title, kind, status)
  values (p_user_id, v_title, 'topup', 'done');

  return v_new;
end;
$$;
