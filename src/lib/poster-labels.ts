import type { SkinPosterTemplate } from '../components/SkinPosterPreview';

export const POSTER_TEMPLATE_LABELS: Record<SkinPosterTemplate, string> = {
  'dark-grid': 'กริดมืด',
  'market-card': 'การ์ดขาย',
  'clean-showcase': 'โชว์เคสสว่าง',
  'compact-strip': 'รายการแนวตั้ง',
};

export const POSTER_TEMPLATE_OPTIONS: { value: SkinPosterTemplate; label: string }[] = [
  { value: 'dark-grid', label: 'กริดมืด — ส่งลูกค้า / ขาย' },
  { value: 'market-card', label: 'การ์ดขาย — โพสต์ premium' },
  { value: 'clean-showcase', label: 'โชว์เคสสว่าง — พื้นขาว' },
  { value: 'compact-strip', label: 'รายการแนวตั้ง — แชทมือถือ' },
];
