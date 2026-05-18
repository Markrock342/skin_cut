import { forwardRef, useMemo, useState } from 'react';
import type { Game, Skin } from '../data/types';
import { SHOP_BRAND } from '../config/shop-brand';
import { getHero } from '../data/catalog';
import { groupSkinsByHero, countUniqueHeroes } from '../lib/poster-groups';
import { POSTER_TEMPLATE_LABELS } from '../lib/poster-labels';
import { resolveSkinImageDisplayUrl } from '../lib/skin-image-url';

export type SkinPosterTemplate = 'dark-grid' | 'market-card' | 'clean-showcase' | 'compact-strip';

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
}: {
  skin: Skin;
  index: number;
  heroName: string;
  strip: boolean;
  showRank: boolean;
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
            onError={() => setImgFailed(true)}
          />
        ) : null}
        {showRank ? <span className="skin-poster__rank">{index + 1}</span> : null}
      </div>
      {!strip ? (
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
    const cellProps = { strip, showRank: strip ? false : showRank };

    let runningIndex = 0;

    return (
      <div
        ref={ref}
        className={`skin-poster skin-poster--${template}${strip ? ' skin-poster--strip' : ''}`}
        data-game={game.id}
      >
        {!strip ? (
          <div className="skin-poster__header">
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
            <strong>
              {skins.length} สกิน
              {heroCount > 1 ? ` · ${heroCount} ฮีโร่` : ''}
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
            <img src={SHOP_BRAND.logoUrl} alt="" width={36} height={36} />
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
