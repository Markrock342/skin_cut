import { useMemo, useState } from 'react';
import type { RovProfileFrameGroup } from '../data/rov/profile-frames';
import {
  filterRovProfileFrames,
  frameHueFromId,
  getRovProfileFrameGroups,
} from '../data/rov/profile-frames';

interface RovProfileFramePickerProps {
  value: string | null;
  onChange: (id: string | null) => void;
}

export function RovProfileFramePicker({ value, onChange }: RovProfileFramePickerProps) {
  const [group, setGroup] = useState<RovProfileFrameGroup | 'all'>('all');
  const [query, setQuery] = useState('');
  const groups = useMemo(() => getRovProfileFrameGroups(), []);
  const frames = useMemo(() => filterRovProfileFrames(group, query), [group, query]);

  return (
    <div className="rov-frame-picker">
      <div className="rov-frame-picker__head">
        <h4 className="rov-frame-picker__title">กรอบโปรไฟล์ RoV</h4>
        <p className="rov-frame-picker__hint">
          ครอบทุกช่องสกินบนโปสเตอร์ — ใส่ PNG เองที่{' '}
          <code className="rov-frame-picker__code">public/assets/rov/profile-frames/&lt;id&gt;.png</code> ตามรหัสด้านล่าง
        </p>
      </div>

      <div className="rov-frame-picker__controls">
        <label className="rov-frame-picker__label" htmlFor="rov-frame-group">
          หมวด
        </label>
        <select
          id="rov-frame-group"
          className="format-select rov-frame-picker__select"
          value={group}
          onChange={(e) => setGroup(e.target.value as RovProfileFrameGroup | 'all')}
        >
          <option value="all">ทั้งหมด ({groups.reduce((a, g) => a + g.count, 0)})</option>
          {groups.map((g) => (
            <option key={g.group} value={g.group}>
              {g.label} ({g.count})
            </option>
          ))}
        </select>
        <label className="rov-frame-picker__label" htmlFor="rov-frame-search">
          ค้นหา
        </label>
        <input
          id="rov-frame-search"
          type="search"
          className="format-select rov-frame-picker__search"
          placeholder="ชื่อหรือรหัส เช่น rank-s12"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="rov-frame-picker__none-row">
        <button
          type="button"
          className={`rov-frame-tile rov-frame-tile--none${value == null ? ' rov-frame-tile--active' : ''}`}
          onClick={() => onChange(null)}
        >
          ไม่ใช้กรอบ
        </button>
      </div>

      <div className="rov-frame-picker__grid" role="listbox" aria-label="เลือกกรอบโปรไฟล์">
        {frames.map((f) => {
          const active = value === f.id;
          const hue = frameHueFromId(f.id);
          return (
            <button
              key={f.id}
              type="button"
              role="option"
              aria-selected={active}
              className={`rov-frame-tile${active ? ' rov-frame-tile--active' : ''}`}
              title={`${f.labelTh} · ${f.id}`}
              onClick={() => onChange(f.id)}
            >
              <span
                className="rov-frame-tile__mock"
                data-preset={f.preset}
                style={{ '--frame-hue': `${hue}` } as React.CSSProperties}
              />
              <span className="rov-frame-tile__label">{f.labelTh}</span>
              <code className="rov-frame-tile__id">{f.id}</code>
            </button>
          );
        })}
      </div>
    </div>
  );
}
