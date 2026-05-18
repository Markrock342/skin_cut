import { shouldLoadAnalytics } from './cookie-consent';

type AnalyticsProvider = 'plausible' | 'ga';

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialized = false;
let pendingPagePath: string | null = null;

function getProvider(): AnalyticsProvider {
  const raw = (import.meta.env.VITE_ANALYTICS_PROVIDER ?? 'plausible').toLowerCase();
  return raw === 'ga' ? 'ga' : 'plausible';
}

function loadPlausible(): void {
  const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN?.trim();
  if (!domain) {
    console.warn('[analytics] ตั้ง VITE_PLAUSIBLE_DOMAIN เพื่อใช้ Plausible');
    return;
  }

  const script = document.createElement('script');
  script.defer = true;
  script.dataset.domain = domain;
  script.src =
    import.meta.env.VITE_PLAUSIBLE_SCRIPT_URL?.trim() ??
    'https://plausible.io/js/script.js';
  script.onload = () => {
    if (pendingPagePath) {
      const path = pendingPagePath;
      pendingPagePath = null;
      sendPlausiblePageview(path);
    }
  };
  document.head.appendChild(script);
}

function sendPlausiblePageview(_path: string): void {
  if (typeof window.plausible === 'function') {
    window.plausible('pageview');
  }
}

function loadGoogleAnalytics(): void {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
  if (!id) {
    console.warn('[analytics] ตั้ง VITE_GA_MEASUREMENT_ID เพื่อใช้ Google Analytics');
    return;
  }

  const loader = document.createElement('script');
  loader.async = true;
  loader.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(loader);

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', id, { anonymize_ip: true });
}

/** โหลดสคริปต์ analytics ครั้งเดียว — เรียกเมื่อ env เปิดและผู้ใช้ opt-in แล้ว */
export function initAnalytics(): void {
  if (initialized || !shouldLoadAnalytics()) return;

  const provider = getProvider();
  if (provider === 'ga') loadGoogleAnalytics();
  else loadPlausible();

  initialized = true;
}

/** ส่ง pageview หลัง SPA เปลี่ยน route (หรือหลัง opt-in) */
export function trackPageView(path?: string): void {
  if (!shouldLoadAnalytics()) return;

  const pagePath = path ?? `${window.location.pathname}${window.location.search}`;

  if (getProvider() === 'ga') {
    const id = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
    if (id && typeof window.gtag === 'function') {
      window.gtag('config', id, { page_path: pagePath });
    }
    return;
  }

  if (typeof window.plausible === 'function') {
    sendPlausiblePageview(pagePath);
  } else {
    pendingPagePath = pagePath;
  }
}
