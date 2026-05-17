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
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AnimatePresence, motion } from 'framer-motion';
import type { Skin } from '../data/types';
import { SkinCard } from './SkinCard';
import { useStudio } from '../context/StudioContext';

function SortableSkinItem({
  skin,
  rank,
  width,
}: {
  skin: Skin;
  rank: number;
  width: number;
}) {
  const { removeSkin } = useStudio();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: skin.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SkinCard
        skin={skin}
        rank={rank}
        width={width}
        draggable
        isDragging={isDragging}
        onRemove={() => removeSkin(skin.id)}
        layoutId={`selected-${skin.id}`}
      />
    </div>
  );
}

export function SortableSelectedStrip() {
  const { selectedSkins, viewSize, reorderSkins } = useStudio();
  const cardWidth = 72 + viewSize * 12;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
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
        ยังไม่มีสกินที่เลือก — คลิกจากกริดด้านล่าง
      </motion.div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={selectedSkins.map((s) => s.id)} strategy={horizontalListSortingStrategy}>
        <div className="selected-strip">
          <AnimatePresence mode="popLayout">
            {selectedSkins.map((skin, i) => (
              <SortableSkinItem key={skin.id} skin={skin} rank={i + 1} width={cardWidth} />
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>
    </DndContext>
  );
}
