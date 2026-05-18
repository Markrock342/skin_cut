import type { AuthUser } from '../types/auth';

export type RegisterOutcome =
  | { kind: 'active'; user: AuthUser }
  | { kind: 'verify_email'; email: string };

export const REGISTER_VERIFY_MESSAGE =
  'สมัครสำเร็จ — ตรวจสอบอีเมลเพื่อยืนยันบัญชีก่อนเข้าสู่ระบบ';
