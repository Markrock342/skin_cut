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
