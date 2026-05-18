import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Check, Coins, QrCode, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { COIN_PACKAGES, PAYMENT_METHODS } from '../data/catalog';
import { fadeUp, springSnappy, staggerContainer } from '../lib/motion';

const PAY_ICONS = {
  promptpay: QrCode,
  truemoney: Wallet,
} as const;

export function TopupPage() {
  const { user } = useAuth();
  const [pkgId, setPkgId] = useState<string | null>(null);
  const [payId, setPayId] = useState<string | null>(null);

  const selectedPkg = COIN_PACKAGES.find((p) => p.id === pkgId);
  const selectedPay = PAYMENT_METHODS.find((p) => p.id === payId);
  const canPay = Boolean(selectedPkg && selectedPay);

  return (
    <motion.div
      className="topup-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={springSnappy}
    >
      <motion.header className="topup-hero" variants={fadeUp} initial="hidden" animate="show">
        <div className="topup-hero__balance" aria-label={`ยอดคงเหลือ ${user?.coins ?? 0} คอยน์`}>
          <span className="topup-hero__icon" aria-hidden>
            <Coins size={28} />
          </span>
          <motion.div
            className="topup-hero__amount"
            key={user?.coins}
            initial={{ scale: 0.92, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={springSnappy}
          >
            <span className="topup-hero__label">ยอดคงเหลือ</span>
            <strong>{(user?.coins ?? 0).toLocaleString('th-TH')}</strong>
            <span className="topup-hero__unit">คอยน์</span>
          </motion.div>
        </div>
        <h1>เติมคอยน์</h1>
        <p>เลือกแพ็กเกจ แล้วชำระด้วยช่องทางที่สะดวก</p>
      </motion.header>

      <motion.section
        className="topup-section"
        aria-labelledby="topup-packages-heading"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <h2 id="topup-packages-heading">แพ็กเกจ</h2>
        <div className="topup-packages" role="radiogroup" aria-labelledby="topup-packages-heading">
          {COIN_PACKAGES.map((pkg) => {
            const selected = pkgId === pkg.id;
            return (
              <motion.button
                key={pkg.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`topup-package${selected ? ' selected' : ''}`}
                onClick={() => setPkgId(pkg.id)}
                variants={fadeUp}
                whileTap={{ scale: 0.97 }}
              >
                {selected && (
                  <span className="topup-package__check" aria-hidden>
                    <Check size={14} strokeWidth={3} />
                  </span>
                )}
                <span className="topup-package__coins">{pkg.coins.toLocaleString('th-TH')}</span>
                <span className="topup-package__unit">คอยน์</span>
                <span className="topup-package__price">฿{pkg.price.toLocaleString('th-TH')}</span>
                {pkg.bonus ? <span className="topup-package__bonus">{pkg.bonus}</span> : null}
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      <motion.section
        className="topup-section"
        aria-labelledby="topup-pay-heading"
        variants={fadeUp}
        initial="hidden"
        animate="show"
      >
        <h2 id="topup-pay-heading">ชำระเงิน</h2>
        <motion.div
          className="topup-pay-row"
          role="radiogroup"
          aria-labelledby="topup-pay-heading"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {PAYMENT_METHODS.map((m) => {
            const selected = payId === m.id;
            const Icon = PAY_ICONS[m.id as keyof typeof PAY_ICONS] ?? Wallet;
            return (
              <motion.button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`topup-pay${selected ? ' selected' : ''}`}
                onClick={() => setPayId(m.id)}
                variants={fadeUp}
                whileTap={{ scale: 0.98 }}
              >
                <span className="topup-pay__icon" aria-hidden>
                  <Icon size={22} />
                </span>
                <span className="topup-pay__name">{m.name}</span>
                <span className="topup-pay__hint">{m.hint}</span>
              </motion.button>
            );
          })}
        </motion.div>

        <div className="topup-notice">
          <AlertTriangle size={18} style={{ flexShrink: 0 }} aria-hidden />
          <span>
            คอยน์ที่ซื้อแล้ว<strong> ไม่สามารถขอคืนเงิน</strong>ได้หลังชำระสำเร็จ
            (ยกเว้นกรณีระบบผิดพลาด) — ดู{' '}
            <Link to="/terms#coins">ข้อกำหนด §5 คอยน์</Link>
          </span>
        </div>
      </motion.section>

      <motion.aside
        className="topup-checkout"
        aria-label="สรุปการชำระ"
        variants={fadeUp}
        initial="hidden"
        animate="show"
      >
        <div className="topup-checkout__rows">
          <motion.div
            className="topup-checkout__row"
            animate={{ opacity: selectedPkg ? 1 : 0.55 }}
            transition={{ duration: 0.2 }}
          >
            <span>แพ็กเกจ</span>
            <strong>{selectedPkg ? `${selectedPkg.coins.toLocaleString('th-TH')} คอยน์` : '—'}</strong>
          </motion.div>
          <motion.div
            className="topup-checkout__row"
            animate={{ opacity: selectedPay ? 1 : 0.55 }}
            transition={{ duration: 0.2 }}
          >
            <span>ช่องทาง</span>
            <strong>{selectedPay?.name ?? '—'}</strong>
          </motion.div>
          <div className="topup-checkout__row topup-checkout__row--total">
            <span>ยอดชำระ</span>
            <strong>
              {selectedPkg ? `฿${selectedPkg.price.toLocaleString('th-TH')}` : '—'}
            </strong>
          </div>
        </div>

        <motion.button
          type="button"
          className="btn-primary topup-checkout__cta"
          disabled={!canPay}
          whileHover={canPay ? { scale: 1.02 } : undefined}
          whileTap={canPay ? { scale: 0.98 } : undefined}
        >
          {canPay ? `ชำระ ฿${selectedPkg!.price.toLocaleString('th-TH')}` : 'เลือกแพ็กเกจและช่องทางชำระ'}
        </motion.button>
      </motion.aside>
    </motion.div>
  );
}
