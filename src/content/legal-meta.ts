/** แก้ข้อมูลนิติบุคคลที่นี่ก่อนเปิดรับชำระเงินจริง */
export const LEGAL_ENTITY = {
  nameTh: 'โครงการ SkinCut',
  nameEn: 'SkinCut Project',
  operatorTh: 'ผู้ดำเนินการ (บุคคลธรรมดา / ทีมพัฒนา)',
  operatorEn: 'Operator (individual developer / small team)',
  addressTh:
    'ที่อยู่ติดต่อ: กรุงเทพมหานคร ประเทศไทย — ระบุที่อยู่จดทะเบียนก่อนเปิดรับชำระเงินและออกใบกำกับภาษี',
  addressEn:
    'Contact address: Bangkok, Thailand — provide registered address before live payments and tax invoices',
  taxId: '— (ยังไม่ได้จดทะเบียนเลขประจำตัวผู้เสียภาษี)',
  taxIdNote:
    'หากจดทะเบียนนิติบุคคลแล้ว ให้เติมเลขประจำตัวผู้เสียภาษีและชื่อจดทะเบียนในไฟล์นี้',
} as const;

export const SERVICE_NAME = 'SkinCut';
export const CONTACT_EMAIL = 'support@skincut.app';
export const IP_EMAIL = 'ip@skincut.app';
export const UPDATED_TH = '18 พฤษภาคม 2569';
export const UPDATED_EN = '18 May 2026';

/** เพิ่เลขเมื่อแก้ข้อกำหนด/นโยบาย — ใช้บันทึกตอนสมัคร */
export const TERMS_VERSION = '2026-05-18';

export const LEGAL_DRAFT_NOTICE_TH =
  'เอกสารฉบับร่างสำหรับแฟนโปรเจกต์ — ไม่ใช่คำปรึกษากฎหมาย หากมีการรับชำระเงินจริง ควรให้ทนายความไทยตรวจ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) และกฎหมายคุ้มครองผู้บริโภคก่อนเผยแพร่';

export const LEGAL_DRAFT_NOTICE_EN =
  'Draft for a fan project — not legal advice. Before accepting real payments, have a Thai lawyer review PDPA and consumer protection compliance.';
