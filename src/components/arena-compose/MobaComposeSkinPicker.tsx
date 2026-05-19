import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getHeroesByGame, getSkinsByHero } from '../../data/catalog';
import type { Hero, Skin } from '../../data/types';
import { setComposeSkinDragData } from '../../lib/compose-skin-drag';
import { resolveSkinImageDisplayUrl } from '../../lib/skin-image-url';
import { preloadSkinImages } from '../../lib/preload-skin-images';
import { SkinCard } from '../SkinCard';
import { MobaComposeSkinStrip } from './MobaComposeSkinStrip';

interface MobaComposeSkinPickerProps {
  gameId: 'rov' | 'mlbb';
  carrySkins?: Skin[];
  onAddSkin: (imageUrl: string, label: string) => void;
}

function heroThumbUrl(heroId: string): string {
  const skins = getSkinsByHero(heroId);
  for (const skin of skins) {
    const src = resolveSkinImageDisplayUrl(skin.imageUrl);
    if (src) return src;
  }
  return '';
}

function ComposeSkinPickCard({
  skin,
  onAddSkin,
}: {
  skin: Skin;
  onAddSkin: (imageUrl: string, label: string) => void;
}) {
  const src = resolveSkinImageDisplayUrl(skin.imageUrl);
  if (!src) return null;

  return (
    <div
      className="arena-compose-skin-pick"
      draggable
      onDragStart={(e) => {
        setComposeSkinDragData(e.dataTransfer, {
          imageUrl: src,
          label: skin.name,
          skinId: skin.id,
        });
      }}
    >
      <SkinCard skin={skin} onSelect={() => onAddSkin(src, skin.name)} />
    </div>
  );
}

function HeroPickChip({
  hero,
  thumb,
  active,
  onSelect,
}: {
  hero: Hero;
  thumb: string;
  active: boolean;
  onSelect: () => void;
}) {
  const initial = hero.name.trim().charAt(0).toUpperCase() || '?';

  return (
    <button
      type="button"
      className={`arena-moba-hero-chip${active ? ' is-active' : ''}`}
      onClick={onSelect}
      title={`${hero.name} — ${hero.skinCount} สกิน`}
      aria-pressed={active}
    >
      <span className="arena-moba-hero-chip__art" aria-hidden>
        {thumb ? (
          <img src={thumb} alt="" loading="lazy" draggable={false} />
        ) : (
          <span className="arena-moba-hero-chip__placeholder">{initial}</span>
        )}
      </span>
      <span className="arena-moba-hero-chip__name">{hero.name}</span>
      <span className="arena-moba-hero-chip__count">{hero.skinCount} สกิน</span>
    </button>
  );
}

export function MobaComposeSkinPicker({
  gameId,
  carrySkins = [],
  onAddSkin,
}: MobaComposeSkinPickerProps) {
  const heroes = useMemo(() => getHeroesByGame(gameId), [gameId]);
  const [heroId, setHeroId] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (heroes.length && !heroes.some((h) => h.id === heroId)) {
      setHeroId(heroes[0].id);
    }
  }, [heroes, heroId]);

  const filteredHeroes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return heroes;
    return heroes.filter((h) => h.name.toLowerCase().includes(q));
  }, [heroes, search]);

  const activeHeroId = filteredHeroes.some((h) => h.id === heroId)
    ? heroId
    : (filteredHeroes[0]?.id ?? heroId);

  const skins = useMemo(
    () => (activeHeroId ? getSkinsByHero(activeHeroId) : []),
    [activeHeroId],
  );

  const heroThumbs = useMemo(() => {
    const map = new Map<string, string>();
    for (const hero of filteredHeroes) {
      map.set(hero.id, heroThumbUrl(hero.id));
    }
    return map;
  }, [filteredHeroes]);

  useEffect(() => {
    preloadSkinImages(skins.map((s) => s.imageUrl));
  }, [skins]);

  const activeHero = heroes.find((h) => h.id === activeHeroId);
  const visibleSkins = skins.filter((skin) => resolveSkinImageDisplayUrl(skin.imageUrl));

  return (
    <motion.div className="arena-panel arena-moba-skin-picker">
      <p className="arena-panel__lead">
        เลือกสกินจากคลัง — ลากวางบนแคนวาสหรือคลิกเพิ่ม
      </p>

      {carrySkins.length > 0 && (
        <MobaComposeSkinStrip skins={carrySkins} onAddSkin={onAddSkin} />
      )}

      <input
        type="search"
        className="arena-moba-skin-picker__search"
        placeholder="ค้นหาตัวละคร..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="ค้นหาตัวละคร"
      />

      <p className="arena-moba-skin-picker__section-label">ตัวละคร</p>
      <motion.div className="arena-moba-hero-grid" role="listbox" aria-label="เลือกตัวละคร">
        {filteredHeroes.length === 0 ? (
          <p className="arena-moba-skin-picker__empty">ไม่พบตัวละครที่ตรงกับคำค้น</p>
        ) : (
          filteredHeroes.map((hero) => (
            <HeroPickChip
              key={hero.id}
              hero={hero}
              thumb={heroThumbs.get(hero.id) ?? ''}
              active={hero.id === activeHeroId}
              onSelect={() => setHeroId(hero.id)}
            />
          ))
        )}
      </motion.div>

      <p className="arena-moba-skins__title">
        {activeHero?.name ?? 'ฮีโร่'} — {skins.length} สกิน
      </p>

      {skins.length === 0 ? (
        <p className="arena-moba-skin-picker__empty">ยังไม่มีสกินในคลังสำหรับตัวละครนี้</p>
      ) : visibleSkins.length === 0 ? (
        <p className="arena-moba-skin-picker__empty">มีสกินแต่ยังไม่มีรูป — ลอง sync คลังใหม่</p>
      ) : (
        <motion.div
          className="skin-grid arena-moba-skin-picker__skins"
          style={{ '--grid-min': '88px' } as React.CSSProperties}
        >
          {visibleSkins.map((skin) => (
            <ComposeSkinPickCard key={skin.id} skin={skin} onAddSkin={onAddSkin} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
