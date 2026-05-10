import { Children, isValidElement, useCallback, useMemo, useState, ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface DraggableBlocksProps {
  storageKey: string;
  children: ReactNode;
  className?: string;
}

/**
 * Wraps children in draggable containers. Each child MUST have a unique `key`
 * (which is read via its element key). Order is persisted in localStorage.
 */
export function DraggableBlocks({ storageKey, children, className }: DraggableBlocksProps) {
  const items = useMemo(() => {
    const arr: { id: string; node: ReactNode }[] = [];
    Children.forEach(children, (child) => {
      if (!isValidElement(child)) return;
      const id = String(child.key ?? "");
      if (!id) return;
      arr.push({ id, node: child });
    });
    return arr;
  }, [children]);

  const [order, setOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        const ids = items.map((i) => i.id);
        const valid = parsed.filter((id) => ids.includes(id));
        const missing = ids.filter((id) => !valid.includes(id));
        return [...valid, ...missing];
      }
    } catch {}
    return items.map((i) => i.id);
  });

  // Sync new/removed children into order
  const itemIds = items.map((i) => i.id);
  const synced = (() => {
    const valid = order.filter((id) => itemIds.includes(id));
    const missing = itemIds.filter((id) => !valid.includes(id));
    return [...valid, ...missing];
  })();

  const map = new Map(items.map((i) => [i.id, i.node]));
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const onDrop = useCallback(
    (targetId: string) => {
      if (!dragId || dragId === targetId) {
        setDragId(null);
        setOverId(null);
        return;
      }
      const next = [...synced];
      const from = next.indexOf(dragId);
      const to = next.indexOf(targetId);
      if (from === -1 || to === -1) return;
      next.splice(to, 0, next.splice(from, 1)[0]);
      setOrder(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      setDragId(null);
      setOverId(null);
    },
    [dragId, synced, storageKey]
  );

  return (
    <div className={cn("space-y-4 sm:space-y-6", className)}>
      {synced.map((id) => {
        const node = map.get(id);
        if (!node) return null;
        const isDragging = dragId === id;
        const isOver = overId === id && dragId && dragId !== id;
        return (
          <div
            key={id}
            draggable
            onDragStart={(e) => {
              setDragId(id);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setOverId(id);
            }}
            onDrop={(e) => {
              e.preventDefault();
              onDrop(id);
            }}
            onDragEnd={() => {
              setDragId(null);
              setOverId(null);
            }}
            className={cn(
              "relative group/block transition-all",
              isDragging && "opacity-40",
              isOver && "ring-2 ring-primary rounded-xl"
            )}
          >
            <div
              className="absolute -left-1 top-3 z-10 cursor-grab active:cursor-grabbing opacity-0 group-hover/block:opacity-100 transition-opacity"
              title="Arraste para reordenar"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
            {node}
          </div>
        );
      })}
    </div>
  );
}
