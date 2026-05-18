/** เครื่องมือภายนอกสำหรับลบพื้นหลัง (MVP — ไม่เรียก API ในเว็บ) */
export const REMOVE_BG_UPLOAD_URL = 'https://www.remove.bg/upload';

export const BG_REMOVAL_TOOLS = [
  {
    id: 'remove-bg',
    name: 'remove.bg',
    url: REMOVE_BG_UPLOAD_URL,
    hint: 'อัปโหลดรูปตัวละคร → ดาวน์โหลด PNG ใส',
  },
  {
    id: 'adobe-express',
    name: 'Adobe Express',
    url: 'https://www.adobe.com/express/feature/image/remove-background',
    hint: 'ฟรี ไม่ต้องสมัคร (จำกัด)',
  },
] as const;
