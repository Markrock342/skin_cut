-- =============================================================================
-- SkinCut: รันไฟล์นี้ครั้งเดียวใน SQL Editor (โปรเจกต์ใหม่)
-- ลำดับ: 001 → 002 → 003  อย่ารัน 003 ก่อน 001
-- =============================================================================

-- ########## 001 profiles + history ##########
-- SkinCut: profiles + activity history
-- รันใน Supabase Dashboard → SQL Editor (หรือ supabase db push)

-- โปรไฟล์ผู้ใช้ (ผูกกับ auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  coins integer not null default 50 check (coins >= 0),
  created_at timestamptz not null default now()
);

-- ประวัติงาน / การเติมคอยน์
create table if not exists public.activity_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  kind text not null default 'studio' check (kind in ('studio', 'topup')),
  status text not null default 'done' check (status in ('done', 'pending', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists activity_history_user_id_idx on public.activity_history (user_id, created_at desc);

-- สร้างโปรไฟล์อัตโนมัติเมื่อสมัคร
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, coins)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1)),
    50
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.activity_history enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_display_name" on public.profiles;
create policy "profiles_update_display_name"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "history_select_own" on public.activity_history;
create policy "history_select_own"
  on public.activity_history for select
  using (auth.uid() = user_id);

drop policy if exists "history_insert_own" on public.activity_history;
create policy "history_insert_own"
  on public.activity_history for insert
  with check (auth.uid() = user_id);

-- ########## 002 terms + contact ##########
-- SkinCut: บันทึกการยอมรับข้อกำหนด + ฟอร์มติดต่อ

alter table public.profiles
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text;

comment on column public.profiles.terms_accepted_at is 'เวลาที่ผู้ใช้ยอมรับข้อกำหนด/นโยบายล่าสุด';
comment on column public.profiles.terms_version is 'รหัสเวอร์ชันเอกสาร เช่น 2026-05-18';

create or replace function public.accept_terms(p_version text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_version is null or length(trim(p_version)) < 4 then
    raise exception 'invalid terms version';
  end if;

  update public.profiles
  set
    terms_accepted_at = now(),
    terms_version = trim(p_version)
  where id = auth.uid();
end;
$$;

revoke all on function public.accept_terms(text) from public;
grant execute on function public.accept_terms(text) to authenticated;

-- ข้อความจากหน้า Contact
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) >= 2),
  email text not null check (position('@' in email) > 1),
  category text not null default 'general'
    check (category in ('general', 'billing', 'privacy', 'ip', 'bug')),
  subject text not null check (char_length(trim(subject)) >= 3),
  message text not null check (char_length(trim(message)) >= 10),
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

drop policy if exists "contact_insert_public" on public.contact_messages;
create policy "contact_insert_public"
  on public.contact_messages for insert
  to anon, authenticated
  with check (true);

-- อ่านได้เฉพาะ service role / Dashboard (ไม่มี policy select สำหรับ client)

-- ########## 003 admin ##########
-- SkinCut: Admin dashboard — สิทธิ์แอดมิน + จัดการหลังบ้าน

-- โปรไฟล์: อีเมล (สำหรับแอดมินดู) + สิทธิ์แอดมิน
alter table public.profiles
  add column if not exists email text,
  add column if not exists is_admin boolean not null default false;

create index if not exists profiles_is_admin_idx on public.profiles (is_admin) where is_admin = true;
create index if not exists profiles_email_idx on public.profiles (email);

-- sync email จาก auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, coins, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1)),
    50,
    new.email
  );
  return new;
end;
$$;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and (p.email is null or p.email <> u.email);

-- ข้อความติดต่อ: สถานะ + โน้ตแอดมิน
alter table public.contact_messages
  add column if not exists status text not null default 'new'
    check (status in ('new', 'read', 'replied', 'archived')),
  add column if not exists admin_note text,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists contact_messages_status_idx
  on public.contact_messages (status, created_at desc);

-- ตั้งค่าเว็บ (แอดมินแก้ได้)
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (key, value)
values
  ('maintenance_mode', 'false'::jsonb),
  ('signup_bonus_coins', '50'::jsonb),
  ('announcement', '""'::jsonb)
on conflict (key) do nothing;

-- ตรวจสอบสิทธิ์แอดมิน
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

-- RLS แอดมิน: profiles
drop policy if exists "profiles_admin_select" on public.profiles;
create policy "profiles_admin_select"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- RLS แอดมิน: activity_history
drop policy if exists "history_admin_select" on public.activity_history;
create policy "history_admin_select"
  on public.activity_history for select
  to authenticated
  using (public.is_admin());

drop policy if exists "history_admin_update" on public.activity_history;
create policy "history_admin_update"
  on public.activity_history for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "history_admin_insert" on public.activity_history;
create policy "history_admin_insert"
  on public.activity_history for insert
  to authenticated
  with check (public.is_admin());

-- RLS แอดมิน: contact_messages
drop policy if exists "contact_admin_select" on public.contact_messages;
create policy "contact_admin_select"
  on public.contact_messages for select
  to authenticated
  using (public.is_admin());

drop policy if exists "contact_admin_update" on public.contact_messages;
create policy "contact_admin_update"
  on public.contact_messages for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- RLS แอดมิน: site_settings
alter table public.site_settings enable row level security;

drop policy if exists "settings_admin_select" on public.site_settings;
create policy "settings_admin_select"
  on public.site_settings for select
  to authenticated
  using (public.is_admin());

drop policy if exists "settings_admin_update" on public.site_settings;
create policy "settings_admin_update"
  on public.site_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ปรับคอยน์ผู้ใช้ (บันทึกประวัติอัตโนมัติ)
create or replace function public.admin_adjust_coins(
  p_user_id uuid,
  p_delta integer,
  p_reason text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new integer;
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

revoke all on function public.admin_adjust_coins(uuid, integer, text) from public;
grant execute on function public.admin_adjust_coins(uuid, integer, text) to authenticated;

-- สถิติแดชบอร์ด
create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select jsonb_build_object(
    'user_count', (select count(*)::int from public.profiles),
    'total_coins', (select coalesce(sum(coins), 0)::int from public.profiles),
    'history_count', (select count(*)::int from public.activity_history),
    'pending_topups', (select count(*)::int from public.activity_history where kind = 'topup' and status = 'pending'),
    'new_contacts', (select count(*)::int from public.contact_messages where status = 'new'),
    'signups_7d', (select count(*)::int from public.profiles where created_at > now() - interval '7 days')
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.admin_dashboard_stats() from public;
grant execute on function public.admin_dashboard_stats() to authenticated;

-- ตั้งแอดมินคนแรก (แก้อีเมลแล้วรันครั้งเดียว):
-- update public.profiles set is_admin = true where email = 'your@email.com';
