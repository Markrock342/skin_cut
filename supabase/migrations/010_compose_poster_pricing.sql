-- โหมด Canva (ROV / MLBB): หักคอยน์ต่อการ์ด + อ่านราคาสาธารณะ

insert into public.site_settings (key, value)
values ('compose_poster_cost', '5'::jsonb)
on conflict (key) do update set value = excluded.value;

create or replace function public.charge_compose_poster(
  p_title text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_cost numeric(12, 2);
  v_balance numeric(12, 2);
  v_title text;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select coalesce((s.value #>> '{}')::numeric, 5)
  into v_cost
  from public.site_settings s
  where s.key = 'compose_poster_cost';

  v_cost := round(v_cost, 2);

  update public.profiles
  set coins = coins - v_cost
  where id = v_uid
    and coins >= v_cost
  returning coins into v_balance;

  if not found then
    raise exception 'insufficient_coins';
  end if;

  v_title := coalesce(nullif(trim(p_title), ''), 'สร้างการ์ด Canva');

  insert into public.activity_history (user_id, title, kind, status)
  values (
    v_uid,
    v_title || ' (−' || trim(to_char(v_cost, 'FM999990.00')) || ' คอยน์)',
    'studio',
    'done'
  );

  return jsonb_build_object(
    'coins', v_balance,
    'charged', v_cost
  );
end;
$$;

revoke all on function public.charge_compose_poster(text) from public;
grant execute on function public.charge_compose_poster(text) to authenticated;

-- ราคาแสดงบน UI (ไม่ต้อง login)
create or replace function public.get_studio_pricing()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'arena_poster_cost',
      coalesce(
        (select (s.value #>> '{}')::numeric from public.site_settings s where s.key = 'arena_poster_cost'),
        3
      ),
    'compose_poster_cost',
      coalesce(
        (select (s.value #>> '{}')::numeric from public.site_settings s where s.key = 'compose_poster_cost'),
        5
      )
  );
$$;

revoke all on function public.get_studio_pricing() from public;
grant execute on function public.get_studio_pricing() to anon, authenticated;
