import html2canvas from 'html2canvas';
import { isSortskinR2Url, resolveSkinImageUrl } from './skin-image-url';

async function waitForPosterImages(node: HTMLElement) {
  const images = [...node.querySelectorAll('img')];
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        }),
    ),
  );
}

/** แปลงรูป proxy เป็น data URL ก่อน html2canvas — ไม่พึ่ง CORS ของ R2 */
async function inlineProxiedImages(node: HTMLElement) {
  const images = [...node.querySelectorAll('img')];

  await Promise.all(
    images.map(async (img) => {
      const raw = img.getAttribute('src');
      if (!raw || raw.startsWith('data:')) return;

      const fetchSrc = isSortskinR2Url(raw) ? resolveSkinImageUrl(raw) : raw;
      if (fetchSrc === raw && !raw.startsWith('/')) return;

      try {
        const res = await fetch(fetchSrc);
        if (!res.ok) return;
        const blob = await res.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
        img.src = dataUrl;
      } catch {
        /* คง src เดิม — อาจได้แค่ gradient */
      }
    }),
  );

  await waitForPosterImages(node);
}

export async function renderNodeToCanvas(node: HTMLElement) {
  await inlineProxiedImages(node);
  return html2canvas(node, {
    scale: 2,
    useCORS: false,
    allowTaint: false,
    backgroundColor: null,
    logging: false,
  });
}

export async function exportNodeToPng(node: HTMLElement, filename: string) {
  const canvas = await renderNodeToCanvas(node);
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 0.92);
  link.click();
}

export async function copyNodeToClipboard(node: HTMLElement) {
  const canvas = await renderNodeToCanvas(node);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/png', 0.92));
  if (!blob) throw new Error('ไม่สามารถสร้างภาพได้');

  if (!navigator.clipboard?.write) {
    throw new Error('เบราว์เซอร์ไม่รองรับคัดลอกภาพ');
  }

  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}
