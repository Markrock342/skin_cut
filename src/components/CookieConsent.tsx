import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { initAnalytics, trackPageView } from '../lib/analytics';
import {
  isAnalyticsEnabledByEnv,
  readCookieConsent,
  saveCookieConsent,
} from '../lib/cookie-consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const analyticsAvailable = isAnalyticsEnabledByEnv();

  useEffect(() => {
    if (!readCookieConsent()) setVisible(true);
  }, []);

  function accept(analytics: boolean) {
    saveCookieConsent(analytics);
    if (analytics) {
      initAnalytics();
      trackPageView();
    }
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="cookie-banner"
          role="dialog"
          aria-label="การตั้งค่าคุกกี้"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
        >
          <div className="cookie-banner-inner">
            <p className="cookie-banner-title">คุกกี้และความเป็นส่วนตัว</p>
            <p className="cookie-banner-text">
              เราใช้คุกกี้ที่จำเป็นสำหรับเข้าสู่ระบบและความปลอดภัย
              {analyticsAvailable
                ? ' คุกกี้วิเคราะห์ช่วยปรับปรุงบริการ — เลือกได้ด้านล่าง'
                : ' (ยังไม่เปิดใช้ analytics บนเซิร์ฟเวอร์นี้)'}
              {' '}
              <Link to="/privacy#cookies">รายละเอียด</Link>
            </p>
            <div className="cookie-banner-actions">
              {analyticsAvailable ? (
                <>
                  <button type="button" className="btn-ghost" onClick={() => accept(false)}>
                    จำเป็นเท่านั้น
                  </button>
                  <button type="button" className="btn-primary" onClick={() => accept(true)}>
                    ยอมรับทั้งหมด
                  </button>
                </>
              ) : (
                <button type="button" className="btn-primary" onClick={() => accept(false)}>
                  เข้าใจแล้ว
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
