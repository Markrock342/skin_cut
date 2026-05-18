import { useId } from 'react';

type BrandLogoProps = {
  size?: number;
  className?: string;
};

/** SkinCut mark — scissors on cut-corner tile */
export function BrandLogo({ size = 32, className }: BrandLogoProps) {
  const uid = useId().replace(/:/g, '');
  const bladeA = `sc-blade-a-${uid}`;
  const bladeB = `sc-blade-b-${uid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={bladeA} x1="6" y1="26" x2="16" y2="6" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22d3ee" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id={bladeB} x1="16" y1="8" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <path fill="#020617" d="M0 0h26.5L32 5.5V32H5.5L0 26.5V0z" />
      <path d="M7.5 23.5 13.5 9l3.5 1.5-4.5 13H7.5z" fill={`url(#${bladeA})`} />
      <path
        d="M16.5 10.5 24 24h-4.5l-2.8-7.2 2.5-1.5 4.5-1.5 1.3 2.5-5.5-4.8z"
        fill={`url(#${bladeB})`}
      />
      <circle cx="13.5" cy="11" r="1.6" fill="#e0f2fe" opacity={0.95} />
      <circle cx="19.5" cy="14.5" r="1.6" fill="#e0f2fe" opacity={0.95} />
      <path
        d="M6 25.5h20"
        stroke="#22d3ee"
        strokeWidth={1.25}
        strokeLinecap="round"
        opacity={0.35}
      />
    </svg>
  );
}
