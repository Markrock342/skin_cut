import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import { CONTACT_EMAIL, IP_EMAIL } from '../content/legal-meta';
import { submitContactMessage, type ContactCategory } from '../lib/contact-api';
import { fadeUp, springSnappy } from '../lib/motion';

const CATEGORIES: { value: ContactCategory; label: string }[] = [
  { value: 'general', label: 'ทั่วไป' },
  { value: 'billing', label: 'การชำระเงิน / คอยน์' },
  { value: 'privacy', label: 'ความเป็นส่วนตัว (PDPA)' },
  { value: 'ip', label: 'ละเมิดลิขสิทธิ์ (DMCA)' },
  { value: 'bug', label: 'รายงานข้อบกพร่อง' },
];

export function ContactPage() {
  const [params] = useSearchParams();
  const initialCategory = (params.get('category') as ContactCategory) || 'general';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<ContactCategory>(
    CATEGORIES.some((c) => c.value === initialCategory) ? initialCategory : 'general',
  );
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await submitContactMessage({ name, email, category, subject, message });
      setSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ส่งไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      className="contact-page"
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={springSnappy}
    >
      <Link to="/" className="back-link">
        <ArrowLeft size={16} />
        กลับหน้าแรก
      </Link>

      <header className="page-title-block">
        <h1>ติดต่อเรา</h1>
        <p>สอบถาม ร้องเรียน IP หรือคำร้อง PDPA — เราตอบภายใน 3–5 วันทำการ (โดยประมาณ)</p>
      </header>

      <motion.div className="contact-direct" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Mail size={18} aria-hidden />
        <motion.div>
          <p>
            <strong>ทั่วไป:</strong>{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
          <p>
            <strong>ลิขสิทธิ์ / DMCA:</strong>{' '}
            <a href={`mailto:${IP_EMAIL}`}>{IP_EMAIL}</a>
          </p>
        </motion.div>
      </motion.div>

      {success ? (
        <motion.div className="contact-success" role="status">
          <p>ส่งข้อความแล้ว — ขอบคุณที่ติดต่อเรา</p>
          <button type="button" className="btn-ghost" onClick={() => setSuccess(false)}>
            ส่งข้อความอีกครั้ง
          </button>
        </motion.div>
      ) : (
        <form className="contact-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>ชื่อ</span>
            <input
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </label>

          <label className="field">
            <span>อีเมล</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          <label className="field">
            <span>หมวด</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ContactCategory)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>หัวข้อ</span>
            <input
              type="text"
              required
              minLength={3}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </label>

          <label className="field">
            <span>ข้อความ</span>
            <textarea
              required
              minLength={10}
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                category === 'ip'
                  ? 'ระบุ URL เนื้อหา ผลงานที่ถูกละเมิด และข้อมูลติดต่อตามแนวทาง DMCA'
                  : undefined
              }
            />
          </label>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary contact-submit" disabled={submitting}>
            <Send size={18} />
            {submitting ? 'กำลังส่ง…' : 'ส่งข้อความ'}
          </button>
        </form>
      )}

      <p className="contact-footnote">
        คำร้องละเมิดลิขสิทธิ์ดูรายละเอียดเพิ่มใน{' '}
        <Link to="/terms#dmca">ข้อกำหนด §9</Link>
      </p>
    </motion.div>
  );
}
