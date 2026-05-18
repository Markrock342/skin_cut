-- สร้าง profiles อัตโนมัติถ้ายังไม่มี (กรณีสมัครก่อนรัน trigger)
create or replace function public.ensure_my_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  u record;
begin
  if auth.uid() is null then
    return;
  end if;

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
    coalesce((u.raw_user_meta_data ->> 'coins')::int, 50),
    u.email
  )
  on conflict (id) do update
  set email = coalesce(public.profiles.email, excluded.email);
end;
$$;

revoke all on function public.ensure_my_profile() from public;
grant execute on function public.ensure_my_profile() to authenticated;
