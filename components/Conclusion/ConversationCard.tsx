// src/components/Conclusion/ConversationCard.tsx
import React from "react";
// CSS 모듈 경로 주의!
import styles from "../../app/conclusion-process/page.module.scss";
// MarkdownRenderer 경로 확인 필요
import MarkdownRenderer from "@/components/MarkdownRenderer";
// 스토어 타입 가져오기 - 실제 경로에 맞게 수정하세요.
import type { ConclusionRecordItem } from "@/lib/store/useDebateStore";
import type { ViewMode } from "@/hooks/useViewMode";

interface Props {
  record: ConclusionRecordItem;
  index: number;
  viewMode: ViewMode;
  isExpanded: boolean; // 현재 카드가 확장되었는지 여부 (list view용)
  onToggleExpand: (index: number) => void; // 카드 확장/축소 토글 핸들러
}

const ConversationCard: React.FC<Props> = ({
  record,
  index,
  viewMode,
  isExpanded,
  onToggleExpand,
}) => {
  return (
    <div
      className={`${styles.analysisCard} ${
        index % 2 === 0 ? styles.left : styles.right
      } ${viewMode === "list" && !isExpanded ? styles.collapsed : ""}`}
      data-role={record.perspective || "expert"} // CSS 스타일링을 위한 data 속성
    >
      <div className={styles.analysisHeader}>
        <h3>
          {/* 역할 배지 */}
          <span className={styles.roleBadge}>{record.role}</span>
          {/* 모델 이름 */}
          {record.model}
        </h3>
        {/* 대화 단계 표시 (값이 있을 경우) */}
        {record.stage !== undefined && (
          <span className={styles.stageBadge}>단계 {record.stage + 1}</span>
        )}
        {/* 리스트 뷰일 때만 확장/축소 버튼 표시 */}
        {viewMode === "list" && (
          <button
            className={styles.expandToggle}
            onClick={() => onToggleExpand(index)}
            aria-label="카드 확장/축소 토글"
          >
            {isExpanded ? "−" : "+"}
          </button>
        )}
      </div>
      {/* 카드 내용 (Markdown 렌더링) */}
      <div className={styles.analysisContent}>
        <MarkdownRenderer>{record.content}</MarkdownRenderer>
      </div>
    </div>
  );
};

export default ConversationCard;
