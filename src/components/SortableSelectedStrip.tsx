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
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AnimatePresence, motion } from 'framer-motion';
import type { Skin } from '../data/types';
import { parseGridFormat } from '../lib/grid-formats';
import { SkinCard } from './SkinCard';
import { useStudio } from '../context/StudioContext';

function SortableSkinItem({
  skin,
  rank,
}: {
  skin: Skin;
  rank: number;
}) {
  const { removeSkin } = useStudio();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: skin.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className="selected-strip__cell"
      {...attributes}
      {...listeners}
      layout
    >
      <SkinCard
        skin={skin}
        rank={rank}
        width={100}
        draggable
        isDragging={isDragging}
        onRemove={() => removeSkin(skin.id)}
        layoutId={`selected-${skin.id}`}
      />
    </motion.div>
  );
}

interface SortableSelectedStripProps {
  /** รูปแบบกริด เช่น 3x1 — ใช้จัดคอลัมน์แบบ SortSkin */
  gridFormat?: string;
}

export function SortableSelectedStrip({ gridFormat = '4x1' }: SortableSelectedStripProps) {
  const { selectedSkins, viewSize, reorderSkins } = useStudio();
  const { cols } = parseGridFormat(gridFormat);
  const cardMin = 72 + viewSize * 12;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = selectedSkins.findIndex((s) => s.id === active.id);
    const newIndex = selectedSkins.findIndex((s) => s.id === over.id);
    if (oldIndex >= 0 && newIndex >= 0) reorderSkins(oldIndex, newIndex);
  };

  if (selectedSkins.length === 0) {
    return (
      <motion.div
        className="selected-strip empty"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        ยังไม่มีสกินที่เลือก — คลิกจากกริดด้านบน
      </motion.div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={selectedSkins.map((s) => s.id)} strategy={rectSortingStrategy}>
        <motion.div
          className="selected-strip selected-strip--grid"
          style={
            {
              '--grid-cols': String(cols),
              '--card-min': `${cardMin}px`,
            } as React.CSSProperties
          }
          layout
        >
          <AnimatePresence mode="popLayout">
            {selectedSkins.map((skin, i) => (
              <SortableSkinItem key={skin.id} skin={skin} rank={i + 1} />
            ))}
          </AnimatePresence>
        </motion.div>
      </SortableContext>
    </DndContext>
  );
}
