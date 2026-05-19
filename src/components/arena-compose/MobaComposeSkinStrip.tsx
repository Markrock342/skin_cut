import type { Skin } from '../../data/types';
import { setComposeSkinDragData } from '../../lib/compose-skin-drag';
import { resolveSkinImageDisplayUrl } from '../../lib/skin-image-url';

interface MobaComposeSkinStripProps {
  skins: Skin[];
  onAddSkin: (imageUrl: string, label: string) => void;
}

export function MobaComposeSkinStrip({ skins, onAddSkin }: MobaComposeSkinStripProps) {
  if (skins.length === 0) return null;

  return (
    <div className="arena-moba-skins">
      <p className="arena-moba-skins__title">
        สกินที่เลือกจากกริด ({skins.length}) — ลากวางบนแคนวาสหรือคลิกเพิ่ม
      </p>
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
