import type { AuthUser } from '../types/auth';

/** อีเมลแอดมินสำรอง (ตั้งใน .env คั่นด้วย comma) — ใช้ก่อนตั้ง is_admin ใน DB */
export function getBootstrapAdminEmails(): string[] {
  const raw = import.meta.env.VITE_ADMIN_EMAILS ?? '';
  return raw
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function resolveIsAdmin(user: Pick<AuthUser, 'email' | 'isAdmin'> | null): boolean {
  if (!user) return false;
  if (user.isAdmin) return true;
  return getBootstrapAdminEmails().includes(user.email.toLowerCase());
}
