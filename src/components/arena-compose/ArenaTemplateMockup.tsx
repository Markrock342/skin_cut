import type { ArenaCanvasTemplate } from '../../data/arena-breakout/canvas-templates';

/** โปสเตอร์ขายไอดี Arena Breakout — viewBox = px จริงของเทมเพลต */
export function ArenaTemplateMockup({
  template,
  className,
}: {
  template: Pick<ArenaCanvasTemplate, 'id' | 'width' | 'height' | 'platform'>;
  className?: string;
}) {
  const { width: w, height: h, id, platform } = template;
  const r = w / h;

  const isBanner = r > 2.4 || id === 'x-header';
  const isStory = r < 0.62 || id.includes('story') || id === 'tiktok-video';
  const isWide = r > 1.15 && !isBanner;
  const isSquare = r >= 0.88 && r <= 1.12;

  const pad = Math.round(Math.min(w, h) * 0.04);
  const stroke = Math.max(1, Math.round(Math.min(w, h) * 0.002));

  const statsW = isBanner
    ? Math.round(w * 0.28)
    : isStory
      ? Math.round(w * 0.88)
      : isWide
        ? Math.round(w * 0.34)
        : Math.round(w * 0.42);
  const statsH = isBanner
    ? Math.round(h * 0.72)
    : isStory
      ? Math.round(h * 0.14)
      : isWide
        ? Math.round(h * 0.78)
        : isSquare
          ? Math.round(h * 0.22)
          : Math.round(h * 0.2);

  const statsX = pad;
  const statsY = isBanner ? Math.round((h - statsH) / 2) : pad;

  const charW = isBanner
    ? Math.round(w * 0.22)
    : isStory
      ? Math.round(w * 0.55)
      : isWide
        ? Math.round(w * 0.38)
        : Math.round(w * 0.48);
  const charH = isBanner
    ? Math.round(h * 0.88)
    : isStory
      ? Math.round(h * 0.36)
      : isWide
        ? Math.round(h * 0.82)
        : Math.round(h * 0.42);
  const charX = isBanner
    ? w - pad - charW
    : isStory
      ? Math.round((w - charW) / 2)
      : isWide
        ? w - pad - charW
        : Math.round((w - charW) / 2);
  const charY = isBanner
    ? pad
    : isStory
      ? statsY + statsH + pad
      : isWide
        ? pad
        : statsY + statsH + pad;

  const priceH = Math.round(Math.min(w, h) * (isBanner ? 0.42 : 0.09));
  const priceW = Math.round(Math.min(w, h) * (isBanner ? 0.2 : 0.32));
  const priceX = isBanner
    ? Math.round(w * 0.34)
    : isStory
      ? pad
      : pad;
  const priceY = isBanner
    ? Math.round((h - priceH) / 2)
    : isStory
      ? h - pad - priceH
      : isWide
        ? h - pad - priceH
        : h - pad - priceH;

  const itemSize = Math.round(Math.min(w, h) * 0.11);
  const itemGap = Math.round(itemSize * 0.18);
  const itemCols = isStory ? 4 : isWide ? 5 : 3;
  const itemRows = isStory ? 2 : 1;
  const gridW = itemCols * itemSize + (itemCols - 1) * itemGap;
  const gridH = itemRows * itemSize + (itemRows - 1) * itemGap;
  const itemsX = isWide
    ? pad
    : isStory
      ? Math.round((w - gridW) / 2)
      : w - pad - gridW;
  const itemsY = isWide
    ? h - pad - gridH
    : isStory
      ? charY + charH + pad
      : charY + charH + Math.round(pad * 0.5);

  const platformLabel =
    platform === 'arena'
      ? 'ขายไอดี'
      : platform === 'instagram'
        ? 'IG'
        : platform === 'facebook'
          ? 'FB'
          : platform === 'tiktok'
            ? 'TikTok'
            : platform === 'line'
              ? 'LINE'
              : platform === 'x'
                ? 'X'
                : 'Studio';

  return (
    <svg
      className={className}
      viewBox={`0 0 ${w} ${h}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`ตัวอย่างโปสเตอร์ ${w}×${h} px`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`ab-bg-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14110e" />
          <stop offset="45%" stopColor="#1f1a14" />
          <stop offset="100%" stopColor="#2a2318" />
        </linearGradient>
        <linearGradient id={`ab-glow-${id}`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#c9a227" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#c9a227" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`ab-gold-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8a6d1f" />
          <stop offset="50%" stopColor="#e8c547" />
          <stop offset="100%" stopColor="#a88428" />
        </linearGradient>
        <pattern
          id={`ab-grid-${id}`}
          width={Math.round(w * 0.04)}
          height={Math.round(w * 0.04)}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${Math.round(w * 0.04)} 0 L 0 0 0 ${Math.round(w * 0.04)}`}
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.04"
            strokeWidth={stroke}
          />
        </pattern>
        <filter id={`ab-soft-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={Math.max(2, Math.round(w * 0.006))} />
        </filter>
      </defs>

      <rect width={w} height={h} fill={`url(#ab-bg-${id})`} />
      <rect width={w} height={h} fill={`url(#ab-grid-${id})`} />
      <ellipse
        cx={isWide ? w * 0.72 : w * 0.5}
        cy={isStory ? h * 0.35 : h * 0.42}
        rx={w * 0.42}
        ry={h * 0.35}
        fill={`url(#ab-glow-${id})`}
        filter={`url(#ab-soft-${id})`}
      />

      {/* กล่องสถิติ */}
      <g opacity={0.95}>
        <rect
          x={statsX}
          y={statsY}
          width={statsW}
          height={statsH}
          rx={Math.round(pad * 0.6)}
          fill="rgba(12,10,8,0.72)"
          stroke="rgba(201,162,39,0.45)"
          strokeWidth={stroke * 1.5}
        />
        {Array.from({ length: isBanner ? 3 : 5 }).map((_, i) => {
          const lineW = statsW * (0.55 + (i % 3) * 0.12);
          const ly = statsY + pad * 1.4 + i * (statsH / (isBanner ? 4 : 6));
          return (
            <rect
              key={`stat-${i}`}
              x={statsX + pad}
              y={ly}
              width={lineW}
              height={Math.round(pad * 0.55)}
              rx={Math.round(pad * 0.2)}
              fill={i === 0 ? 'rgba(232,197,71,0.35)' : 'rgba(255,255,255,0.12)'}
            />
          );
        })}
      </g>

      {/* ตัวละคร */}
      <g opacity={0.92}>
        <rect
          x={charX}
          y={charY}
          width={charW}
          height={charH}
          rx={Math.round(pad * 0.5)}
          fill="rgba(30,26,20,0.55)"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <ellipse
          cx={charX + charW * 0.5}
          cy={charY + charH * 0.28}
          rx={charW * 0.16}
          ry={charH * 0.09}
          fill="rgba(255,255,255,0.14)"
        />
        <path
          d={`M ${charX + charW * 0.32} ${charY + charH * 0.42}
              Q ${charX + charW * 0.5} ${charY + charH * 0.3} ${charX + charW * 0.68} ${charY + charH * 0.42}
              L ${charX + charW * 0.78} ${charY + charH * 0.92}
              L ${charX + charW * 0.22} ${charY + charH * 0.92} Z`}
          fill="rgba(61,74,47,0.55)"
          stroke="rgba(201,162,39,0.25)"
          strokeWidth={stroke}
        />
      </g>

      {/* ไอเทม */}
      <g opacity={0.9}>
        {Array.from({ length: itemCols * itemRows }).map((_, i) => {
          const col = i % itemCols;
          const row = Math.floor(i / itemCols);
          const ix = itemsX + col * (itemSize + itemGap);
          const iy = itemsY + row * (itemSize + itemGap);
          return (
            <rect
              key={`item-${i}`}
              x={ix}
              y={iy}
              width={itemSize}
              height={itemSize}
              rx={Math.round(itemSize * 0.14)}
              fill="rgba(0,0,0,0.45)"
              stroke="rgba(201,162,39,0.35)"
              strokeWidth={stroke}
            />
          );
        })}
      </g>

      {/* ราคา */}
      <g>
        <rect
          x={priceX}
          y={priceY}
          width={priceW}
          height={priceH}
          rx={priceH / 2}
          fill="rgba(0,0,0,0.55)"
          stroke={`url(#ab-gold-${id})`}
          strokeWidth={stroke * 1.5}
        />
        <text
          x={priceX + priceW / 2}
          y={priceY + priceH * 0.68}
          textAnchor="middle"
          fill="#e8c547"
          fontSize={Math.round(priceH * 0.42)}
          fontFamily="system-ui, sans-serif"
          fontWeight="700"
        >
          ฿ 9,999
        </text>
      </g>

      {/* ป้ายแพลตฟอร์ม */}
      <g>
        <rect
          x={w - pad - Math.round(w * 0.14)}
          y={pad}
          width={Math.round(w * 0.14)}
          height={Math.round(h * 0.045)}
          rx={Math.round(h * 0.012)}
          fill="rgba(0,0,0,0.5)"
          stroke="rgba(201,162,39,0.4)"
          strokeWidth={stroke}
        />
        <text
          x={w - pad - Math.round(w * 0.07)}
          y={pad + Math.round(h * 0.032)}
          textAnchor="middle"
          fill="#c9a227"
          fontSize={Math.round(Math.min(w, h) * 0.028)}
          fontFamily="system-ui, sans-serif"
          fontWeight="600"
        >
          {platformLabel}
        </text>
      </g>

      <rect
        width={w}
        height={h}
        fill="none"
        stroke="rgba(201,162,39,0.12)"
        strokeWidth={stroke * 2}
      />
    </svg>
  );
}
