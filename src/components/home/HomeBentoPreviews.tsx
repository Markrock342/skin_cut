import { useState } from 'react';
import { motion } from 'framer-motion';
import { GripVertical, Monitor, Smartphone } from 'lucide-react';
import {
  getHomeShowcaseList,
  HOME_GRID_SHOWCASE,
  HOME_STUDIO_SHOWCASE,
  type ResolvedShowcaseSkin,
} from '../../data/home-showcase';
import { resolveSkinImageDisplayUrl } from '../../lib/skin-image-url';

function MiniSkinArt({ skin, className }: { skin: ResolvedShowcaseSkin; className: string }) {
  const [failed, setFailed] = useState(false);
  const src = resolveSkinImageDisplayUrl(skin.imageUrl);

  return (
    <motion.div
      className={className}
      style={{ '--hue': skin.hue } as React.CSSProperties}
      layout="position"
    >
      {src && !failed ? (
        <img
          className="home-showcase-img"
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : null}
    </motion.div>
  );
}

export function HomeStudioPreview() {
  const skins = getHomeShowcaseList(HOME_STUDIO_SHOWCASE);

  return (
    <motion.div
      className="home-bento-preview home-bento-preview--studio"
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <motion.div className="home-studio-strip">
        {skins.map((skin, index) => (
          <motion.div
            key={skin.id}
            className={`home-mini-skin${index === 1 ? ' home-mini-skin--lift' : ''}`}
            animate={
              index === 1
                ? { x: [0, 14, 6, 0], y: [0, -6, -2, 0], rotate: [0, -1.5, 0] }
                : undefined
            }
            transition={
              index === 1
                ? { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
                : undefined
            }
          >
            <span className="home-mini-skin__rank">{skin.rank ?? index + 1}</span>
            <MiniSkinArt skin={skin} className="home-mini-skin__art" />
            <span className="home-mini-skin__name">{skin.label}</span>
            {index === 1 && (
              <span className="home-mini-skin__grip" aria-hidden>
                <GripVertical size={14} />
              </span>
            )}
          </motion.div>
        ))}
      </motion.div>
      <p className="home-preview-caption">ลากการ์ดเพื่อเรียงอันดับ · spring animation</p>
    </motion.div>
  );
}

function GridCell({ skin, index }: { skin: ResolvedShowcaseSkin; index: number }) {
  const [failed, setFailed] = useState(false);
  const src = resolveSkinImageDisplayUrl(skin.imageUrl);

  return (
    <motion.div
      className="home-mini-grid__cell"
      style={{ '--hue': skin.hue } as React.CSSProperties}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      title={skin.label}
    >
      {src && !failed ? (
        <img
          className="home-showcase-img"
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : null}
    </motion.div>
  );
}

export function HomeDevicesPreview() {
  const skins = getHomeShowcaseList(HOME_GRID_SHOWCASE);
  const phoneSkins = skins.slice(0, 4);
  const desktopSkins = skins;

  return (
    <motion.div
      className="home-bento-preview home-bento-preview--devices"
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
    >
      <div className="home-device home-device--phone">
        <motion.div className="home-device__chrome">
          <Smartphone size={14} aria-hidden />
          <span>มือถือ</span>
        </motion.div>
        <motion.div
          className="home-device__screen"
          animate={{ opacity: [0.88, 1, 0.88] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <motion.div
            className="home-mini-grid home-mini-grid--phone"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            {phoneSkins.map((skin, i) => (
              <GridCell key={skin.id} skin={skin} index={i} />
            ))}
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        className="home-device home-device--desktop"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      >
        <motion.div className="home-device__chrome">
          <Monitor size={14} aria-hidden />
          <span>จอใหญ่</span>
        </motion.div>
        <div className="home-device__screen home-device__screen--wide">
          <motion.div className="home-mini-grid home-mini-grid--desktop">
            {desktopSkins.map((skin, i) => (
              <GridCell key={skin.id} skin={skin} index={i} />
            ))}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
