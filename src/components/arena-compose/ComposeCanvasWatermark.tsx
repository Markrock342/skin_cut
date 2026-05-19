import { SHOP_BRAND } from '../../config/shop-brand';
import { BrandLogo } from '../BrandLogo';

/** ลายน้ำบนแคนวาส — มี `data-export-ignore` ไม่ถูก capture ตอน export PNG */
export function ComposeCanvasWatermark() {
  return (
    <div className="compose-canvas-watermark" data-export-ignore aria-hidden>
      <div className="compose-canvas-watermark__pattern" />
      <div className="compose-canvas-watermark__badge">
        <BrandLogo size={28} />
        <div className="compose-canvas-watermark__badge-text">
          <strong>{SHOP_BRAND.name}</strong>
          <span>ตัวอย่าง · Export เพื่อไฟล์เต็ม px</span>
        </div>
      </div>
    </div>
  );
}
