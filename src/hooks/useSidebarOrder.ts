import { useCallback, useEffect, useState } from "react";

const STORAGE_PREFIX = "mvb_sidebar_order";

const storageKey = (userId?: string | null) =>
  `${STORAGE_PREFIX}:${userId || "anon"}`;

/**
 * Persists a custom order of sidebar items (by unique key) in localStorage,
 * scoped per user. Items not present in the saved order keep their default
 * position at the end.
 */
export function useSidebarOrder(userId?: string | null) {
  const [order, setOrder] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(userId));
      setOrder(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setOrder([]);
    }
  }, [userId]);

  const persist = useCallback(
    (next: string[]) => {
      setOrder(next);
      try {
        localStorage.setItem(storageKey(userId), JSON.stringify(next));
      } catch {
        /* ignore quota errors */
      }
    },
    [userId]
  );

  /** Sorts items following the saved order; unknown items go to the end. */
  const applyOrder = useCallback(
    <T,>(items: T[], getKey: (item: T) => string): T[] => {
      if (!order.length) return items;
      return [...items].sort((a, b) => {
        const ia = order.indexOf(getKey(a));
        const ib = order.indexOf(getKey(b));
        if (ia === -1 && ib === -1) return 0;
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
    },
    [order]
  );

  /** Moves an item to a new index within the given key list and saves it. */
  const moveItem = useCallback(
    (keys: string[], fromIndex: number, toIndex: number) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= keys.length ||
        toIndex >= keys.length
      ) {
        return;
      }
      const next = [...keys];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      persist(next);
    },
    [persist]
  );

  const resetOrder = useCallback(() => {
    setOrder([]);
    try {
      localStorage.removeItem(storageKey(userId));
    } catch {
      /* ignore */
    }
  }, [userId]);

  return { order, hasCustomOrder: order.length > 0, applyOrder, moveItem, resetOrder };
}
