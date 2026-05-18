import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { GripVertical, Monitor, Smartphone } from 'lucide-react';
import {
  HOME_GRID_SHOWCASE,
  HOME_STUDIO_SHOWCASE,
  type ResolvedShowcaseSkin,
} from '../../data/home-showcase';
import { useHomeShowcase } from '../../hooks/useHomeShowcase';
import { resolveSkinImageDisplayUrl } from '../../lib/skin-image-url';

function MiniSkinArt({ skin, className }: { skin: ResolvedShowcaseSkin; className: string }) {
  const [failed, setFailed] = useState(false);
  const src = resolveSkinImageDisplayUrl(skin.imageUrl);

  return (
    <div className={className} style={{ '--hue': skin.hue } as React.CSSProperties}>
      {src && !failed ? (
        <img
          className="home-showcase-img"
          src={src}
          alt={skin.label}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : null}
    </div>
  );
}

export function HomeStudioPreview() {
  const reduceMotion = useReducedMotion();
  const { skins, loading } = useHomeShowcase(HOME_STUDIO_SHOWCASE);

  return (
    <motion.div
      className="home-bento-preview home-bento-preview--studio"
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      {loading && skins.length === 0 ? (
        <p className="home-preview-caption">กำลังโหลดตัวอย่างสกิน…</p>
      ) : (
        <div className="home-studio-strip">
          {skins.map((skin, index) => (
            <motion.div
              key={skin.id}
              className={`home-mini-skin${index === 1 ? ' home-mini-skin--lift' : ''}`}
              animate={
                !reduceMotion && index === 1
                  ? { x: [0, 14, 6, 0], y: [0, -6, -2, 0], rotate: [0, -1.5, 0] }
                  : undefined
              }
              transition={
                !reduceMotion && index === 1
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
        </div>
      )}
      <p className="home-preview-caption">ลากการ์ดเพื่อเรียงอันดับ · spring animation</p>
    </motion.div>
  );
}

function GridCell({ skin, index }: { skin: ResolvedShowcaseSkin; index: number }) {
  const [failed, setFailed] = useState(false);
  const src = resolveSkinImageDisplayUrl(skin.imageUrl);
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="home-mini-grid__cell"
      style={{ '--hue': skin.hue } as React.CSSProperties}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      title={skin.label}
    >
      {src && !failed ? (
        <img
          className="home-showcase-img"
          src={src}
          alt={skin.label}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : null}
    </motion.div>
  );
}

export function HomeDevicesPreview() {
  const reduceMotion = useReducedMotion();
  const { skins, loading } = useHomeShowcase(HOME_GRID_SHOWCASE);
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
      {loading && skins.length === 0 ? (
        <p className="home-preview-caption">กำลังโหลดตัวอย่าง…</p>
      ) : (
        <>
          <div className="home-device home-device--phone">
            <div className="home-device__chrome">
              <Smartphone size={14} aria-hidden />
              <span>มือถือ</span>
            </div>
            <motion.div
              className="home-device__screen"
              animate={reduceMotion ? undefined : { opacity: [0.88, 1, 0.88] }}
              transition={reduceMotion ? undefined : { duration: 3, repeat: Infinity }}
            >
              <motion.div
                className="home-mini-grid home-mini-grid--phone"
                animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
                transition={reduceMotion ? undefined : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                {phoneSkins.map((skin, i) => (
                  <GridCell key={skin.id} skin={skin} index={i} />
                ))}
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            className="home-device home-device--desktop"
            animate={reduceMotion ? undefined : { y: [0, -3, 0] }}
            transition={reduceMotion ? undefined : { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          >
            <motion.div className="home-device__chrome">
              <Monitor size={14} aria-hidden />
              <span>จอใหญ่</span>
            </motion.div>
            <div className="home-device__screen home-device__screen--wide">
              <div className="home-mini-grid home-mini-grid--desktop">
                {desktopSkins.map((skin, i) => (
                  <GridCell key={skin.id} skin={skin} index={i} />
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
