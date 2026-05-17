# SkinCut

เว็บจัดเรียงสกินเกม (แนว [SortSkin](https://sortskin.com/)) — UI แยกสไตล์ (cyan/violet + glass dock) พร้อม animation ลื่นด้วย Framer Motion และ drag-and-drop

## เริ่มใช้

```bash
npm install
npm run dev
```

เปิด `http://localhost:5173`

## เส้นทาง

| Path | หน้า |
|------|------|
| `/` | หน้าแรก |
| `/games` | เลือกเกม (ROV / MLBB) |
| `/studio/:gameId` | สตูดิโอจัดสกิน + ลากเรียง |
| `/topup` | เติมคอยน์ (เดโม) |
| `/history` | ประวัติ (เดโม) |

## Stack

- Vite + React + TypeScript
- Framer Motion — page / scroll / spring transitions
- @dnd-kit — ลากเรียงสกินที่เลือก
- Lucide icons

## หมายเหตุ

ข้อมูลสกิน/ภาพเป็น mock (gradient) ไม่ใช่ asset จากเกมจริง — ต่อ API หรือ CDN ได้ที่ `src/data/catalog.ts`
