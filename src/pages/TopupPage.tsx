import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Coins } from 'lucide-react';
import { COIN_PACKAGES, PAYMENT_METHODS } from '../data/catalog';
import { fadeUp, springSnappy } from '../lib/motion';

export function TopupPage() {
  const [pkgId, setPkgId] = useState<string | null>(null);
  const [payId, setPayId] = useState<string | null>(null);

  const canPay = pkgId && payId;

  return (
    <div style={{ paddingBottom: 88 }}>
      <motion.div className="page-title-block" variants={fadeUp} initial="hidden" animate="show">
        <h1>เติมคอยน์</h1>
        <p>เลือกจำนวนและวิธีชำระเงิน</p>
      </motion.div>

      <motion.div
        className="topup-grid"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springSnappy}
      >
        <motion.div variants={fadeUp}>
          <h3>1 เลือกจำนวน</h3>
          {COIN_PACKAGES.map((pkg) => (
            <motion.button
              key={pkg.id}
              type="button"
              className={`option-card${pkgId === pkg.id ? ' selected' : ''}`}
              onClick={() => setPkgId(pkg.id)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.99 }}
            >
              <Coins size={28} color="var(--accent)" />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <strong style={{ display: 'block', color: 'var(--text)' }}>
                  {pkg.coins} คอยน์
                </strong>
                <span>{pkg.price} บาท</span>
                {pkg.bonus && <span className="option-bonus"> {pkg.bonus}</span>}
              </div>
              <span className="radio" aria-hidden />
            </motion.button>
          ))}
        </motion.div>

        <motion.div variants={fadeUp}>
          <h3>2 วิธีชำระเงิน</h3>
          {PAYMENT_METHODS.map((m) => (
            <motion.button
              key={m.id}
              type="button"
              className={`option-card${payId === m.id ? ' selected' : ''}`}
              onClick={() => setPayId(m.id)}
              whileHover={{ x: 4 }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'var(--surface-2)',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                }}
              >
                {m.id === 'promptpay' ? 'PP' : 'TM'}
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <strong style={{ display: 'block', color: 'var(--text)' }}>{m.name}</strong>
                <span>{m.hint}</span>
              </div>
              <span className="radio" aria-hidden />
            </motion.button>
          ))}

          <div className="alert-box">
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>การเติมคอยน์ไม่สามารถขอคืนเงินได้หลังชำระสำเร็จ (เดโม)</span>
          </div>
        </motion.div>
      </motion.div>

      <div className="topup-bar">
        <span>
          {canPay
            ? `พร้อมชำระ — ${COIN_PACKAGES.find((p) => p.id === pkgId)?.coins} คอยน์`
            : 'เลือกจำนวนคอยน์และวิธีชำระ'}
        </span>
        <motion.button
          type="button"
          className="btn-primary"
          disabled={!canPay}
          whileHover={canPay ? { scale: 1.03 } : undefined}
        >
          ชำระเงิน →
        </motion.button>
      </div>
    </div>
  );
}
