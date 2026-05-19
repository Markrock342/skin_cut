import { useState } from 'react';
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
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  FolderOpen,
  GripVertical,
  Lock,
  Trash2,
  Ungroup,
  Unlock,
} from 'lucide-react';
import type { ArenaComposeLayer } from '../../data/arena-breakout/compose';
import { buildLayersPanelItems } from '../../lib/compose-layer-groups';

interface BreakoutLayersPanelProps {
  layers: ArenaComposeLayer[];
  selectedId: string | null;
  selectedGroupId?: string | null;
  onSelect: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onPatch: (id: string, patch: Partial<ArenaComposeLayer>) => void;
  onDelete: (id: string) => void;
  onUngroupGroup?: (groupId: string) => void;
}

function SortableRow({
  layer,
  selected,
  inGroup,
  onSelect,
  onPatch,
  onDelete,
}: {
  layer: ArenaComposeLayer;
  selected: boolean;
  inGroup?: boolean;
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
      className={`ab-layer-row${selected ? ' is-selected' : ''}${isDragging ? ' is-dragging' : ''}${inGroup ? ' ab-layer-row--nested' : ''}`}
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

function GroupFolderRow({
  groupId,
  label,
  members,
  selectedId,
  selectedGroupId,
  expanded,
  onToggle,
  onSelectMember,
  onUngroupGroup,
  onPatch,
  onDelete,
}: {
  groupId: string;
  label: string;
  members: ArenaComposeLayer[];
  selectedId: string | null;
  selectedGroupId: string | null | undefined;
  expanded: boolean;
  onToggle: () => void;
  onSelectMember: (id: string) => void;
  onUngroupGroup?: (groupId: string) => void;
  onPatch: (id: string, patch: Partial<ArenaComposeLayer>) => void;
  onDelete: (id: string) => void;
}) {
  const isGroupSelected = selectedGroupId === groupId;

  return (
    <div className={`ab-layer-group${isGroupSelected ? ' is-selected' : ''}`}>
      <div className="ab-layer-group__head">
        <button type="button" className="ab-layer-group__toggle" onClick={onToggle} aria-expanded={expanded}>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <button
          type="button"
          className="ab-layer-group__label"
          onClick={() => onSelectMember(members[0]!.id)}
        >
          <FolderOpen size={14} />
          {label}
        </button>
        {onUngroupGroup ? (
          <button
            type="button"
            className="ab-layer-row__icon"
            onClick={() => onUngroupGroup(groupId)}
            title="แยกกลุ่ม"
          >
            <Ungroup size={14} />
          </button>
        ) : null}
      </div>
      {expanded ? (
        <div className="ab-layer-group__children">
          {members.map((layer) => (
            <SortableRow
              key={layer.id}
              layer={layer}
              selected={selectedId === layer.id}
              inGroup
              onSelect={() => onSelectMember(layer.id)}
              onPatch={(patch) => onPatch(layer.id, patch)}
              onDelete={() => onDelete(layer.id)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function BreakoutLayersPanel({
  layers,
  selectedId,
  selectedGroupId,
  onSelect,
  onReorder,
  onPatch,
  onDelete,
  onUngroupGroup,
}: BreakoutLayersPanelProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sorted = [...layers].sort((a, b) => b.zIndex - a.zIndex);
  const ids = sorted.map((l) => l.id);
  const panelItems = buildLayersPanelItems(layers);

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

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  return (
    <section className="ab-layers-panel">
      <h3>เลเยอร์</h3>
      <p className="ab-layers-panel__hint">ลากเพื่อจัดลำดับ · กลุ่ม = ย้ายรูปพร้อมกัน</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="ab-layer-list">
            {panelItems.map((item) => {
              if (item.type === 'group') {
                const expanded = !collapsedGroups.has(item.groupId);
                return (
                  <GroupFolderRow
                    key={item.groupId}
                    groupId={item.groupId}
                    label={item.label}
                    members={item.members}
                    selectedId={selectedId}
                    selectedGroupId={selectedGroupId}
                    expanded={expanded}
                    onToggle={() => toggleGroup(item.groupId)}
                    onSelectMember={onSelect}
                    onUngroupGroup={onUngroupGroup}
                    onPatch={onPatch}
                    onDelete={onDelete}
                  />
                );
              }
              return (
                <SortableRow
                  key={item.layer.id}
                  layer={item.layer}
                  selected={selectedId === item.layer.id}
                  onSelect={() => onSelect(item.layer.id)}
                  onPatch={(patch) => onPatch(item.layer.id, patch)}
                  onDelete={() => onDelete(item.layer.id)}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}
