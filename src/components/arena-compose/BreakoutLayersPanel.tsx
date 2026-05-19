import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, EyeOff, GripVertical, Lock, Trash2, Unlock } from 'lucide-react';
import type { ArenaComposeLayer } from '../../data/arena-breakout/compose';

interface BreakoutLayersPanelProps {
  layers: ArenaComposeLayer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onPatch: (id: string, patch: Partial<ArenaComposeLayer>) => void;
  onDelete: (id: string) => void;
}

function SortableRow({
  layer,
  selected,
  onSelect,
  onPatch,
  onDelete,
}: {
  layer: ArenaComposeLayer;
  selected: boolean;
  onSelect: () => void;
  onPatch: (patch: Partial<ArenaComposeLayer>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: layer.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`ab-layer-row${selected ? ' is-selected' : ''}${isDragging ? ' is-dragging' : ''}`}
    >
      <button type="button" className="ab-layer-row__grip" {...attributes} {...listeners}>
        <GripVertical size={14} />
      </button>
      <button type="button" className="ab-layer-row__label" onClick={onSelect}>
        <span className="ab-layer-row__kind">{layer.kind}</span>
        {layer.label}
      </button>
      <button
        type="button"
        className="ab-layer-row__icon"
        onClick={() => onPatch({ visible: !layer.visible })}
        title={layer.visible ? 'ซ่อน' : 'แสดง'}
      >
        {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>
      <button
        type="button"
        className="ab-layer-row__icon"
        onClick={() => onPatch({ locked: !layer.locked })}
        title={layer.locked ? 'ปลดล็อก' : 'ล็อก'}
      >
        {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
      </button>
      {layer.kind !== 'text-money' && layer.kind !== 'text-price' ? (
        <button type="button" className="ab-layer-row__icon danger" onClick={onDelete} title="ลบ">
          <Trash2 size={14} />
        </button>
      ) : null}
    </div>
  );
}

export function BreakoutLayersPanel({
  layers,
  selectedId,
  onSelect,
  onReorder,
  onPatch,
  onDelete,
}: BreakoutLayersPanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sorted = [...layers].sort((a, b) => b.zIndex - a.zIndex);
  const ids = sorted.map((l) => l.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = [...ids];
    const [removed] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, removed);
    onReorder(next);
  };

  return (
    <section className="ab-layers-panel">
      <h3>เลเยอร์</h3>
      <p className="ab-layers-panel__hint">ลากเพื่อจัดลำดับ · บนสุด = อยู่หน้า</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="ab-layer-list">
            {sorted.map((layer) => (
              <SortableRow
                key={layer.id}
                layer={layer}
                selected={selectedId === layer.id}
                onSelect={() => onSelect(layer.id)}
                onPatch={(patch) => onPatch(layer.id, patch)}
                onDelete={() => onDelete(layer.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}
