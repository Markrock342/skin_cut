export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('โหลดรูปไม่สำเร็จ'));
    img.src = src;
  });
}

/** ตัดรูปตามพิกเซลของต้นฉบับ คืน data URL (PNG) */
export function cropImageToDataUrl(
  image: HTMLImageElement,
  rect: CropRect,
  mime: 'image/png' | 'image/jpeg' = 'image/png',
): string {
  const x = Math.max(0, Math.round(rect.x));
  const y = Math.max(0, Math.round(rect.y));
  const w = Math.min(Math.round(rect.width), image.naturalWidth - x);
  const h = Math.min(Math.round(rect.height), image.naturalHeight - y);

  if (w < 2 || h < 2) {
    throw new Error('พื้นที่ตัดเล็กเกินไป');
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('ไม่สามารถสร้าง canvas ได้');

  ctx.drawImage(image, x, y, w, h, 0, 0, w, h);
  return canvas.toDataURL(mime, mime === 'image/jpeg' ? 0.92 : undefined);
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
    reader.readAsDataURL(file);
  });
}
