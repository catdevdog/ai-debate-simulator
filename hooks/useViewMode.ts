// src/hooks/useViewMode.ts (또는 hooks/useViewMode.ts)
import { useState, useCallback } from "react";

export type ViewMode = "card" | "list";

export const useViewMode = (initialMode: ViewMode = "card") => {
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
  const [expandedCards, setExpandedCards] = useState<number[]>([]);

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "card" ? "list" : "card"));
    setExpandedCards([]); // 뷰 모드 변경 시 확장 상태 초기화
  }, []);

  const toggleCardExpand = useCallback((index: number) => {
    setExpandedCards((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }, []);

  return {
    viewMode,
    expandedCards,
    toggleViewMode,
    toggleCardExpand,
  };
};
