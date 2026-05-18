-- ยกเลิกโบนัส 50 คอยน์ตอนสมัคร — สมาชิกใหม่เริ่มที่ 0 (เติมคอยน์เอง)

insert into public.site_settings (key, value)
values ('signup_bonus_coins', '0'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

alter table public.profiles
  alter column coins set default 0;

create or replace function public.signup_bonus_coins_amount()
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select greatest(
    0,
    coalesce((select (s.value #>> '{}')::numeric from public.site_settings s where s.key = 'signup_bonus_coins'), 0)
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bonus numeric(12, 2);
begin
  v_bonus := public.signup_bonus_coins_amount();

  insert into public.profiles (id, display_name, coins, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'coins')::numeric, v_bonus),
    new.email
  );
  return new;
end;
$$;

create or replace function public.ensure_my_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  u record;
  v_bonus numeric(12, 2);
begin
  if auth.uid() is null then
    return;
  end if;

  v_bonus := public.signup_bonus_coins_amount();

  select id, email, raw_user_meta_data
  into u
  from auth.users
  where id = auth.uid();

  if not found then
    return;
  end if;

  insert into public.profiles (id, display_name, coins, email)
  values (
    u.id,
    coalesce(nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''), split_part(u.email, '@', 1)),
    coalesce((u.raw_user_meta_data ->> 'coins')::numeric, v_bonus),
    u.email
  )
  on conflict (id) do update
  set email = coalesce(public.profiles.email, excluded.email);
end;
$$;
