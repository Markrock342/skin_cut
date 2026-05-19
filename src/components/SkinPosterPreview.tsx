import { forwardRef, useMemo, useState } from 'react';
import type { Game, Skin } from '../data/types';
import { SHOP_BRAND } from '../config/shop-brand';
import { getHero } from '../data/catalog';
import { groupSkinsByHero, countUniqueHeroes } from '../lib/poster-groups';
import { BrandLogo } from './BrandLogo';
import { POSTER_TEMPLATE_LABELS } from '../lib/poster-labels';
import { posterSkinImageScale, posterSkinObjectPosition } from '../lib/poster-game-style';
import { resolveSkinImageDisplayUrl } from '../lib/skin-image-url';
import { ROV_PROFILE_FRAMES_ENABLED } from '../config/features';
import { SkinPosterFrameOverlay } from './SkinPosterFrameOverlay';

export type SkinPosterTemplate =
  | 'skincut-studio'
  | 'dark-grid'
  | 'market-card'
  | 'clean-showcase'
  | 'compact-strip';

interface SkinPosterPreviewProps {
  game: Game;
  skins: Skin[];
  gridFormat: string;
  template: SkinPosterTemplate;
  groupByHero?: boolean;
  showWatermark?: boolean;
  shopName?: string;
  variant?: 'full' | 'strip';
  showRank?: boolean;
  /** RoV เท่านั้น — กรอบโปรไฟล์ทับทุกช่องสกิน */
  rovProfileFrameId?: string | null;
  /** PNG export — พื้นหลัง + ชื่อสกินใต้การ์ด */
  stripExportCanvas?: boolean;
}

function gridColumns(gridFormat: string, template: SkinPosterTemplate, variant: 'full' | 'strip') {
  if (template === 'compact-strip' || variant === 'strip') {
    const cols = Number(gridFormat.split('x')[0]);
    return Number.isFinite(cols) && cols > 0 ? cols : 5;
  }
  const cols = Number(gridFormat.split('x')[0]);
  return Number.isFinite(cols) && cols > 0 ? cols : 4;
}

function SkinPosterCell({
  skin,
  index,
  heroName,
  strip,
  showRank,
  rovProfileFrameId,
  gameId,
  stripExportCanvas,
}: {
  skin: Skin;
  index: number;
  heroName: string;
  strip: boolean;
  showRank: boolean;
  rovProfileFrameId?: string | null;
  gameId: string;
  stripExportCanvas: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const imageSrc = resolveSkinImageDisplayUrl(skin.imageUrl);
  const showImage = Boolean(imageSrc) && !imgFailed;

  return (
    <figure className={`skin-poster__item${strip ? ' skin-poster__item--strip' : ''}`}>
      <div
        className={`skin-poster__art skin-poster__art--${skin.tier}`}
        style={{ '--hue': skin.hue } as React.CSSProperties}
      >
        {showImage ? (
          <img
            src={imageSrc}
            alt={skin.name}
            loading="eager"
            decoding="async"
            style={{
              objectPosition: posterSkinObjectPosition(gameId, strip && stripExportCanvas),
              transform:
                strip && stripExportCanvas
                  ? `scale(${posterSkinImageScale(gameId, true)})`
                  : undefined,
            }}
            onError={() => setImgFailed(true)}
          />
        ) : null}
        {ROV_PROFILE_FRAMES_ENABLED && rovProfileFrameId && gameId === 'rov' ? (
          <SkinPosterFrameOverlay frameId={rovProfileFrameId} strip={strip} />
        ) : null}
        {showRank ? <span className="skin-poster__rank">{index + 1}</span> : null}
      </div>
      {strip && stripExportCanvas ? (
        <figcaption className="skin-poster__strip-caption">
          <strong>{skin.name}</strong>
        </figcaption>
      ) : !strip ? (
        <figcaption>
          {heroName ? <em>{heroName}</em> : null}
          <strong>{skin.name}</strong>
        </figcaption>
      ) : null}
    </figure>
  );
}

export const SkinPosterPreview = forwardRef<HTMLDivElement, SkinPosterPreviewProps>(
  (
    {
      game,
      skins,
      gridFormat,
      template,
      groupByHero = false,
      showWatermark = true,
      shopName = SHOP_BRAND.name,
      variant = 'full',
      showRank = true,
      rovProfileFrameId = null,
      stripExportCanvas = false,
    },
    ref,
  ) => {
    const strip = variant === 'strip';
    const columns = gridColumns(gridFormat, template, variant);
    const heroNames = useMemo(() => {
      const map = new Map<string, string>();
      skins.forEach((skin) => {
        if (!map.has(skin.heroId)) {
          map.set(skin.heroId, getHero(skin.heroId)?.name ?? skin.heroId);
        }
      });
      return map;
    }, [skins]);

    const heroGroups = useMemo(() => groupSkinsByHero(skins), [skins]);
    const heroCount = countUniqueHeroes(skins);
    const useGroupedLayout = !strip && groupByHero && heroCount > 1;
    const gridStyle = { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` };
    const cellProps = {
      strip,
      showRank: strip ? false : showRank,
      rovProfileFrameId,
      gameId: game.id,
      stripExportCanvas: strip && stripExportCanvas,
    };

    let runningIndex = 0;

    return (
      <div
        ref={ref}
        className={`skin-poster skin-poster--${template}${strip ? ' skin-poster--strip' : ''}${strip && stripExportCanvas ? ' skin-poster--strip-export' : ''}`}
        data-game={game.id}
      >
        {!strip ? (
          <div className="skin-poster__header">
            {template === 'skincut-studio' ? (
              <div className="skin-poster__brand-row">
                <BrandLogo size={48} />
                <div>
                  <span className="skin-poster__eyebrow">SKINCUT STUDIO</span>
                  <h2>
                    {game.shortName}
                    {useGroupedLayout ? ` · ${heroCount} ตัวละคร` : ''}
                  </h2>
                </div>
              </div>
            ) : (
              <div>
                <span className="skin-poster__eyebrow">{POSTER_TEMPLATE_LABELS[template]}</span>
                <h2>
                  {game.shortName}
                  {useGroupedLayout ? ` · ${heroCount} ฮีโร่` : ''} · สกินที่เลือก
                </h2>
                {useGroupedLayout ? (
                  <p className="skin-poster__subtitle">จัดกลุ่มตามฮีโร่ · เรียงตามความแรร์ในแต่ละกลุ่ม</p>
                ) : null}
              </div>
            )}
            <strong className="skin-poster__count-badge">
              {skins.length} สกิน
              {heroCount > 1 ? ` · ${heroCount} ตัว` : ''}
            </strong>
          </div>
        ) : null}

        {useGroupedLayout ? (
          <div className="skin-poster__hero-groups">
            {heroGroups.map((group) => {
              const heroName = heroNames.get(group.heroId) ?? group.heroId;
              const sectionStart = runningIndex;
              const cells = group.skins.map((skin, i) => {
                const rank = sectionStart + i;
                return (
                  <SkinPosterCell
                    key={`${skin.id}-${rank}`}
                    skin={skin}
                    index={rank}
                    heroName=""
                    {...cellProps}
                  />
                );
              });
              runningIndex += group.skins.length;
              return (
                <section key={group.heroId} className="skin-poster__hero-section">
                  <header className="skin-poster__hero-head">
                    <h3>{heroName}</h3>
                    <span>{group.skins.length} สกิน</span>
                  </header>
                  <div className="skin-poster__grid" style={gridStyle}>
                    {cells}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="skin-poster__grid" style={gridStyle}>
            {skins.map((skin, index) => (
              <SkinPosterCell
                key={`${skin.id}-${index}`}
                skin={skin}
                index={index}
                heroName={heroNames.get(skin.heroId) ?? ''}
                {...cellProps}
              />
            ))}
          </div>
        )}

        {showWatermark && !strip ? (
          <div className="skin-poster__watermark" aria-hidden>
            <BrandLogo size={36} />
            <div className="skin-poster__watermark-text">
              <strong>{shopName}</strong>
              <span>{SHOP_BRAND.tagline}</span>
            </div>
          </div>
        ) : null}
      </div>
    );
  },
);

SkinPosterPreview.displayName = 'SkinPosterPreview';
