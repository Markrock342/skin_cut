-- SkinCut: แอดมินเริ่มต้น + มอบสิทธิผ่านเว็บได้ (ไม่ต้องรัน SQL ทีละคน)
-- รันครั้งเดียวหลัง 000/003 (SQL Editor)

insert into public.site_settings (key, value)
values ('bootstrap_admin_emails', '["markrock342@gmail.com"]'::jsonb)
on conflict (key) do update
set value = excluded.value, updated_at = now();

create or replace function public.is_bootstrap_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from auth.users u
    cross join lateral jsonb_array_elements_text(
      coalesce(
        (select s.value from public.site_settings s where s.key = 'bootstrap_admin_emails'),
        '[]'::jsonb
      )
    ) as boot(email)
    where u.id = auth.uid()
      and lower(boot.email) = lower(u.email)
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  )
  or public.is_bootstrap_admin();
$$;

revoke all on function public.is_bootstrap_admin() from public;
grant execute on function public.is_bootstrap_admin() to authenticated, anon;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

-- เรียกจากแอปครั้งแรกหลังล็อกอิน (อีเมลใน bootstrap list) → ตั้ง is_admin ถาวรใน profiles
create or replace function public.bootstrap_claim_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
begin
  if v_uid is null then
    return false;
  end if;

  select email into v_email from auth.users where id = v_uid;
  if v_email is null or not public.is_bootstrap_admin() then
    return false;
  end if;

  update public.profiles
  set
    is_admin = true,
    email = coalesce(email, v_email)
  where id = v_uid;

  return true;
end;
$$;

revoke all on function public.bootstrap_claim_admin() from public;
grant execute on function public.bootstrap_claim_admin() to authenticated;
