import type { ArenaCanvasTemplate } from '../../data/arena-breakout/canvas-templates';
import { previewUrlForTemplate } from '../../lib/template-preview-images';
import {
  formatTemplateRatioLabel,
  templatePreviewDisplaySize,
} from '../../lib/template-preview-size';
import { ArenaTemplateMockup } from './ArenaTemplateMockup';

export type TemplatePreviewVariant = 'skins' | 'mockup';

interface TemplatePreviewThumbProps {
  template: ArenaCanvasTemplate;
  /** ใช้เมื่อ variant = skins */
  previewPool?: string[];
  variant?: TemplatePreviewVariant;
}

export function TemplatePreviewThumb({
  template,
  previewPool = [],
  variant = 'mockup',
}: TemplatePreviewThumbProps) {
  const { width, height } = templatePreviewDisplaySize(template.width, template.height);
  const useMockup = variant === 'mockup';

  return (
    <div
      className="arena-template-card__thumb-wrap"
      title={`${template.width.toLocaleString()} × ${template.height.toLocaleString()} px`}
    >
      <div className="arena-template-card__thumb" style={{ width, height }}>
        {useMockup ? (
          <ArenaTemplateMockup
            template={template}
            className="arena-template-card__thumb-mockup"
          />
        ) : (
          (() => {
            const src = previewUrlForTemplate(template, previewPool);
            return src ? (
              <img
                src={src}
                alt=""
                className="arena-template-card__thumb-img"
                loading="lazy"
                decoding="async"
              />
            ) : null;
          })()
        )}
        <span className="arena-template-card__thumb-ratio" aria-hidden>
          {formatTemplateRatioLabel(template.width, template.height)}
        </span>
      </div>
      <span className="arena-template-card__thumb-dims" aria-hidden>
        {template.width.toLocaleString()}×{template.height.toLocaleString()}
      </span>
    </div>
  );
}
