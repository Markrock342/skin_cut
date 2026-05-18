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
