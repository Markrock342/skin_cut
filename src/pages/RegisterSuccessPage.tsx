import { Link, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Inbox, LogIn, Mail } from 'lucide-react';
import { REGISTER_VERIFY_MESSAGE } from '../lib/auth-types';
import { fadeUp, springSnappy, staggerContainer } from '../lib/motion';

type LocationState = {
  email?: string;
};

const steps = [
  'เปิดกล่องจดหมายของอีเมลที่สมัคร',
  'คลิกลิงก์ "Confirm" หรือ "ยืนยันอีเมล" จาก SkinCut',
  'กลับมาเข้าสู่ระบบด้วยอีเมลและรหัสผ่านที่ตั้งไว้',
];

export function RegisterSuccessPage() {
  const location = useLocation();
  const email = (location.state as LocationState | null)?.email?.trim();

  if (!email) {
    return <Navigate to="/register" replace />;
  }

  return (
    <motion.div
      className="auth-page auth-page--success"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      <motion.div
        className="auth-card auth-card--success"
        variants={fadeUp}
        transition={springSnappy}
      >
        <motion.div
          className="auth-success-icon"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22, delay: 0.05 }}
        >
          <span className="auth-success-icon-ring" aria-hidden />
          <CheckCircle2 size={40} strokeWidth={2} />
        </motion.div>

        <motion.div className="auth-card-head" variants={fadeUp}>
          <h1>สมัครสำเร็จ</h1>
          <p className="auth-success-lead">{REGISTER_VERIFY_MESSAGE}</p>
        </motion.div>

        <motion.div className="auth-email-chip" variants={fadeUp}>
          <Mail size={18} aria-hidden />
          <span>{email}</span>
        </motion.div>

        <motion.ol className="auth-success-steps" variants={fadeUp}>
          {steps.map((text, i) => (
            <li key={text}>
              <span className="auth-success-step-num">{i + 1}</span>
              <span>{text}</span>
            </li>
          ))}
        </motion.ol>

        <motion.div className="auth-success-hint" variants={fadeUp}>
          <Inbox size={16} aria-hidden />
          <span>ไม่เห็นอีเมล? ตรวจโฟลเดอร์ Spam หรือรอ 2–3 นาที</span>
        </motion.div>

        <motion.div className="auth-success-actions" variants={fadeUp}>
          <Link
            to="/login"
            state={{ email, registered: true }}
            className="btn-primary auth-submit"
          >
            <LogIn size={18} />
            ไปหน้าเข้าสู่ระบบ
            <ArrowRight size={18} />
          </Link>
          <Link to="/" className="btn-ghost auth-success-home">
            กลับหน้าแรก
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
