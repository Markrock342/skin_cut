import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TERMS_VERSION } from '../content/legal';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fadeUp, springSnappy } from '../lib/motion';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!acceptedTerms) {
      setError('กรุณายอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว');
      return;
    }

    if (password !== confirm) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    setSubmitting(true);
    try {
      const outcome = await register(email, password, displayName, true);
      if (outcome.kind === 'verify_email') {
        navigate('/register/success', {
          replace: true,
          state: { email: outcome.email },
        });
        return;
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'สมัครสมาชิกไม่สำเร็จ');
    } finally {
      setSubmitting(false);
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
            <UserPlus size={22} />
          </span>
          <h1>สมัครสมาชิก</h1>
          <p>สร้างบัญชีเพื่อสร้างโปสเตอร์และเติมคอยน์เมื่อต้องการใช้งาน</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>ชื่อที่แสดง</span>
            <input
              type="text"
              name="displayName"
              autoComplete="nickname"
              required
              minLength={2}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="ชื่อเล่นของคุณ"
            />
          </label>

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
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="อย่างน้อย 8 ตัวอักษร"
            />
          </label>

          <label className="field">
            <span>ยืนยันรหัสผ่าน</span>
            <input
              type="password"
              name="confirm"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="พิมพ์รหัสผ่านอีกครั้ง"
            />
          </label>

          <label className="auth-terms">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              required
            />
            <span>
              ฉันยอมรับ{' '}
              <Link to="/terms" target="_blank" rel="noopener noreferrer">
                ข้อกำหนด
              </Link>
              {', '}
              <Link to="/privacy" target="_blank" rel="noopener noreferrer">
                ความเป็นส่วนตัว
              </Link>
              {' และ '}
              <Link to="/contract" target="_blank" rel="noopener noreferrer">
                ข้อตกลงบริการ
              </Link>
              <span className="auth-terms-version"> (v{TERMS_VERSION})</span>
            </span>
          </label>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary auth-submit"
            disabled={submitting || !acceptedTerms}
          >
            {submitting ? 'กำลังสมัคร…' : 'สร้างบัญชี'}
          </button>
        </form>

        <p className="auth-switch">
          มีบัญชีแล้ว? <Link to="/login">เข้าสู่ระบบ</Link>
        </p>
      </motion.div>
    </div>
  );
}
