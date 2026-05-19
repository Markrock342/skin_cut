import { LayoutGrid } from 'lucide-react';
import type { Skin } from '../../data/types';
import { setComposeSkinDragData } from '../../lib/compose-skin-drag';
import { formatGridLabel, suggestGridFormat } from '../../lib/grid-formats';
import { countUniqueHeroes } from '../../lib/poster-groups';
import { resolveSkinImageDisplayUrl } from '../../lib/skin-image-url';

interface MobaComposeSkinStripProps {
  skins: Skin[];
  onAddSkin: (imageUrl: string, label: string) => void;
  onAddAllSkins?: () => void;
  groupByHero?: boolean;
}

export function MobaComposeSkinStrip({
  skins,
  onAddSkin,
  onAddAllSkins,
  groupByHero = false,
}: MobaComposeSkinStripProps) {
  if (skins.length === 0) return null;

  return (
    <div className="arena-moba-skins">
      <p className="arena-moba-skins__title">
        สกินที่เลือกจากกริด ({skins.length}) — ลากวางบนแคนวาสหรือคลิกเพิ่ม
      </p>
      {onAddAllSkins && skins.length >= 1 && (
        <button type="button" className="btn-primary arena-moba-add-all-btn" onClick={onAddAllSkins}>
          <LayoutGrid size={16} />
          เพิ่มทั้งหมด + จัดกริด
          {skins.length >= 2 ? (
            <small className="arena-moba-add-all-btn__hint">
              {groupByHero && countUniqueHeroes(skins) > 1
                ? `แยก ${countUniqueHeroes(skins)} ฮีโร่`
                : formatGridLabel(suggestGridFormat(skins.length))}
            </small>
          ) : null}
        </button>
      )}
      <div className="arena-moba-skin-grid" role="list">
        {skins.map((skin) => {
          const src = resolveSkinImageDisplayUrl(skin.imageUrl);
          if (!src) return null;
          return (
            <button
              key={skin.id}
              type="button"
              role="listitem"
              className="arena-moba-skin-cell"
              draggable
              onDragStart={(e) => {
                setComposeSkinDragData(e.dataTransfer, {
                  imageUrl: src,
                  label: skin.name,
                  skinId: skin.id,
                });
              }}
              onClick={() => onAddSkin(src, skin.name)}
              title={skin.name}
            >
              <img src={src} alt="" loading="lazy" draggable={false} />
              <span className="arena-moba-skin-cell__name">{skin.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
