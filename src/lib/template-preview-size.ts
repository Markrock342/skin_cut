/** ขนาดแสดงตัวอย่างใน grid — สัดส่วนตรง px จริง (ขอบยาวสุด = PREVIEW_MAX_EDGE) */

export const TEMPLATE_PREVIEW_MAX_EDGE = 168;

export function templatePreviewDisplaySize(width: number, height: number) {
  const scale = TEMPLATE_PREVIEW_MAX_EDGE / Math.max(width, height, 1);
  return {
    width: Math.max(48, Math.round(width * scale)),
    height: Math.max(48, Math.round(height * scale)),
    scale,
  };
}

export function formatTemplateRatioLabel(width: number, height: number) {
  const r = width / height;
  if (r > 1.12) return 'แนวนอน';
  if (r < 0.88) return 'แนวตั้ง';
  return '1:1';
}
