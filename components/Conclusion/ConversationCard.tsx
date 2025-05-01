// src/components/Conclusion/ConversationCard.tsx
import React from "react";
import styles from "../../app/conclusion-process/page.module.scss";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import type { ConclusionRecordItem } from "@/lib/store/useDebateStore";

interface Props {
  record: ConclusionRecordItem;
  index: number;
}

const ConversationCard: React.FC<Props> = ({ record, index }) => {
  return (
    <div
      className={`${styles.analysisCard} ${
        index % 2 === 0 ? styles.left : styles.right
      }`}
      data-role={record.perspective || "expert"}
    >
      <div className={styles.analysisHeader}>
        <h3>
          <span className={styles.roleBadge}>{record.role}</span>
          {record.model}
        </h3>
        {record.stage !== undefined && (
          <span className={styles.stageBadge}>단계 {record.stage + 1}</span>
        )}
      </div>
      <div className={styles.analysisContent}>
        <MarkdownRenderer>{record.content}</MarkdownRenderer>
      </div>
    </div>
  );
};

export default ConversationCard;
