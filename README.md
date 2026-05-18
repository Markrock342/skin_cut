# SkinCut

เว็บเครื่องมือจัดภาพสกิน/โปรโมทบัญชี — แนว [SortSkin](https://sortskin.com/) แต่ดีไนน์และ UX แยกต่างหาก

## เกมที่รองรับ

| เกม | โหมด | ผลลัพธ์ |
|-----|------|---------|
| **ROV** | กริดสกิน MOBA | เลือกฮีโร่ → ลากเรียงสกิน |
| **MLBB** | กริดสกิน MOBA | เหมือน ROV |
| **Arena Breakout** | การ์ดโปรโมทบัญชี | เทมเพลต 3 แบบ × 6 สไตล์ · ไอเทม 370 รูป · export PNG |

## เริ่มใช้

```bash
npm install
npm run dev:api   # เทอร์มินัล 1 — API (login / register / detect)
npm run dev       # เทอร์มินัล 2 — เว็บ
```

- สมัคร: `/register` · เข้าสู่ระบบ: `/login`
- หน้า **เติมคอยน์** และ **ประวัติ** ต้อง login ก่อน
- บัญชีเก็บที่ `.data/users.json` (local) · production ใช้ Vercel Functions ที่ `api/auth/`

## Arena Breakout — ไอเทม & เทมเพลต

- รูปไอเทม: `public/assets/arena-breakout/items/` (จากโฟลเดอร์ `‼️website`)
- Wireframe เทมเพลต: `public/assets/arena-breakout/templates/` (แนวนอน / สี่เหลี่ยม / แนวตั้ง · แบบ 1–6)
- สร้าง catalog ใหม่หลังเพิ่มรูป: `npm run build:arena`

## ดึงรูปสกิน MOBA (Fandom Wiki)

```bash
npm run fetch:assets:rov    # ROV 10 ฮีโร่
npm run fetch:assets:mlbb   # MLBB 10 ฮีโร่
# หรือ
npm run fetch:assets -- --game=rov --limit=5
```

สคริปต์จะบันทึกรูปที่ `public/assets/` และสร้าง `src/data/{game}/catalog.fetched.json`  
**ไม่** scrape เว็บขายไอดี — ใช้ API ของ [Fandom](https://www.fandom.com/) เท่านั้น

> รูปในเกมเป็นลิขสิทธิ์ผู้พัฒนาเกม ใช้เพื่อเครื่องมือแฟน/อ้างอิง หากมีข้อร้องเรียนให้ลบ asset ที่เกี่ยวข้อง

## Deploy (Vercel)

- Framework: **Vite**
- Build: `npm run build`
- Output: `dist`

## Stack

Vite · React · TypeScript · Framer Motion · @dnd-kit · html2canvas
