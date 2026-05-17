import html2canvas from 'html2canvas';

export async function exportNodeToPng(node: HTMLElement, filename: string) {
  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    logging: false,
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 0.92);
  link.click();
}
