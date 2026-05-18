const STORAGE_KEY = 'skincut_cookie_consent';

export type CookieConsent = {
  essential: true;
  analytics: boolean;
  decidedAt: string;
};

export function readCookieConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed?.essential !== true || typeof parsed.analytics !== 'boolean') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCookieConsent(analytics: boolean): CookieConsent {
  const value: CookieConsent = {
    essential: true,
    analytics,
    decidedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  return value;
}

/** เปิด analytics ผ่าน env — ยังไม่โหลดสคริปต์จนกว่าผู้ใช้จะ opt-in */
export function isAnalyticsEnabledByEnv(): boolean {
  return import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
}

export function shouldLoadAnalytics(): boolean {
  if (!isAnalyticsEnabledByEnv()) return false;
  return readCookieConsent()?.analytics === true;
}
