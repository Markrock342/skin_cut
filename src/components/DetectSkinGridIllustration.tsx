/** ภาพตัวอย่างกริดสกิน — inline SVG ไม่พึ่งไฟล์ภายนอก */
export function DetectSkinGridIllustration() {
  return (
    <svg
      className="detect-modal-tips__img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 140 100"
      width={140}
      height={100}
      role="img"
      aria-hidden
    >
      <defs>
        <linearGradient id="detect-tip-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a1030" />
          <stop offset="100%" stopColor="#0d1a2e" />
        </linearGradient>
      </defs>
      <rect width="140" height="100" rx="8" fill="url(#detect-tip-bg)" />
      <g fill="none" stroke="rgba(103,232,249,0.45)" strokeWidth="1">
        <rect x="6" y="10" width="28" height="32" rx="3" />
        <rect x="38" y="10" width="28" height="32" rx="3" />
        <rect x="70" y="10" width="28" height="32" rx="3" />
        <rect x="102" y="10" width="28" height="32" rx="3" />
        <rect x="6" y="48" width="28" height="32" rx="3" />
        <rect x="38" y="48" width="28" height="32" rx="3" />
        <rect x="70" y="48" width="28" height="32" rx="3" />
        <rect x="102" y="48" width="28" height="32" rx="3" />
      </g>
      <text x="20" y="28" fill="#e2e8f0" fontSize="6" textAnchor="middle" fontFamily="system-ui,sans-serif">
        Yorn
      </text>
      <text x="52" y="28" fill="#e2e8f0" fontSize="6" textAnchor="middle" fontFamily="system-ui,sans-serif">
        Lauriel
      </text>
      <text x="70" y="92" fill="rgba(226,232,240,0.7)" fontSize="5.5" textAnchor="middle" fontFamily="system-ui,sans-serif">
        กริดสกินในเกม
      </text>
    </svg>
  );
}
