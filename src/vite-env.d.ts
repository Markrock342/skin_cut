/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** อีเมลแอดมินชั่วคราว คั่นด้วย comma (ก่อนตั้ง is_admin ใน DB) */
  readonly VITE_ADMIN_EMAILS?: string;
  /** เปิดตัวเลือก analytics ในแบนเนอร์คุกกี้ */
  readonly VITE_ENABLE_ANALYTICS?: string;
  /** plausible (ค่าเริ่มต้น) หรือ ga */
  readonly VITE_ANALYTICS_PROVIDER?: string;
  readonly VITE_PLAUSIBLE_DOMAIN?: string;
  readonly VITE_PLAUSIBLE_SCRIPT_URL?: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
