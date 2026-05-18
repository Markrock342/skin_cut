-- ตั้ง markrock342@gmail.com เป็นแอดมิน (รันใน Supabase → SQL Editor)
-- ต้องสมัครบัญชีนี้ในแอปก่อน (ให้มีแถวใน profiles)

-- sync อีเมลจาก auth.users (กรณี profiles.email ยังว่าง)
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('markrock342@gmail.com');

-- ตั้งสิทธิ์แอดมิน
update public.profiles
set is_admin = true
where id in (
  select id from auth.users where lower(email) = lower('markrock342@gmail.com')
)
or lower(coalesce(email, '')) = lower('markrock342@gmail.com');

-- ตรวจผล (ควรได้ is_admin = true อย่างน้อย 1 แถว)
select id, email, display_name, is_admin, coins, created_at
from public.profiles
where lower(coalesce(email, '')) = lower('markrock342@gmail.com')
   or id in (select id from auth.users where lower(email) = lower('markrock342@gmail.com'));
