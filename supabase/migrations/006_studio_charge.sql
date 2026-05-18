-- หักคอยน์เมื่อสร้างโปสเตอร์สตูดิโอ (แบบ SortSkin)

insert into public.site_settings (key, value)
values ('studio_poster_cost_cents', '150'::jsonb)
on conflict (key) do update set value = excluded.value;

create or replace function public.charge_studio_poster(p_title text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_cost_cents integer;
  v_cost_coins integer;
  v_balance integer;
  v_title text;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select coalesce((s.value #>> '{}')::integer, 150)
  into v_cost_cents
  from public.site_settings s
  where s.key = 'studio_poster_cost_cents';

  v_cost_coins := (v_cost_cents + 99) / 100;

  update public.profiles
  set coins = coins - v_cost_coins
  where id = v_uid
    and coins >= v_cost_coins
  returning coins into v_balance;

  if not found then
    raise exception 'insufficient_coins';
  end if;

  v_title := coalesce(nullif(trim(p_title), ''), 'สร้างโปสเตอร์สกิน');

  insert into public.activity_history (user_id, title, kind, status)
  values (
    v_uid,
    v_title || ' (−' || v_cost_coins::text || ' คอยน์)',
    'studio',
    'done'
  );

  return jsonb_build_object(
    'coins', v_balance,
    'charged', v_cost_coins,
    'cost_cents', v_cost_cents
  );
end;
$$;

revoke all on function public.charge_studio_poster(text) from public;
grant execute on function public.charge_studio_poster(text) to authenticated;
