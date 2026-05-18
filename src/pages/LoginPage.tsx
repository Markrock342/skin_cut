import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { resendSignupConfirmation } from '../lib/auth-api';
import { REGISTER_VERIFY_MESSAGE } from '../lib/auth-types';
import { fadeUp, springSnappy } from '../lib/motion';

type LoginLocationState = {
  from?: string;
  email?: string;
  registered?: boolean;
};

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = (location.state as LoginLocationState | null) ?? {};
  const from = routeState.from ?? '/';
  const justRegistered = routeState.registered === true;

  const [email, setEmail] = useState(routeState.email ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(justRegistered);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResendMsg(null);
    setNeedsEmailConfirm(false);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const isConfirm =
        err instanceof Error &&
        (err.name === 'EmailNotConfirmed' || err.message.includes('ยืนยันอีเมล'));
      if (isConfirm) setNeedsEmailConfirm(true);
      setError(err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (!email.trim()) {
      setResendMsg('กรุณากรอกอีเมลก่อน');
      return;
    }
    setResending(true);
    setResendMsg(null);
    try {
      await resendSignupConfirmation(email);
      setResendMsg('ส่งอีเมลยืนยันแล้ว — ตรวจกล่องจดหมายและ Spam');
      setNeedsEmailConfirm(true);
    } catch (e) {
      setResendMsg(e instanceof Error ? e.message : 'ส่งไม่สำเร็จ');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="auth-page">
      <motion.div
        className="auth-card"
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={springSnappy}
      >
        <div className="auth-card-head">
          <span className="auth-icon" aria-hidden>
            <LogIn size={22} />
          </span>
          <h1>เข้าสู่ระบบ</h1>
          <p>ใช้บัญชี SkinCut เพื่อเติมคอยน์และดูประวัติ</p>
        </div>

        {justRegistered && (
          <motion.div
            className="auth-notice auth-notice--success"
            role="status"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springSnappy}
          >
            <CheckCircle2 size={18} aria-hidden />
            <span>{REGISTER_VERIFY_MESSAGE}</span>
          </motion.div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>อีเมล</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label className="field">
            <span>รหัสผ่าน</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          {(needsEmailConfirm || justRegistered) && (
            <div className="auth-verify-box">
              <p>ยังไม่ได้ยืนยันอีเมล? กดส่งลิงก์อีกครั้ง</p>
              <button
                type="button"
                className="btn-secondary auth-resend-btn"
                disabled={resending || !email.trim()}
                onClick={() => void handleResend()}
              >
                {resending ? 'กำลังส่ง…' : 'ส่งอีเมลยืนยันอีกครั้ง'}
              </button>
              {resendMsg && (
                <p className={resendMsg.includes('แล้ว') ? 'auth-resend-ok' : 'auth-error'} role="status">
                  {resendMsg}
                </p>
              )}
            </div>
          )}

          <button type="submit" className="btn-primary auth-submit" disabled={submitting}>
            {submitting ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p className="auth-switch">
          ยังไม่มีบัญชี? <Link to="/register">สมัครสมาชิก</Link>
        </p>
      </motion.div>
    </div>
  );
}
