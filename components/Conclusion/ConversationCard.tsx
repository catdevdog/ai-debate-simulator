import React from "react";
import styles from "../../app/conclusion-process/page.module.scss";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import type { ConclusionRecordItem } from "@/lib/store/useDebateStore";

interface Props {
  record: ConclusionRecordItem;
  index: number;
}

const ConversationCard: React.FC<Props> = ({ record, index }) => {
  const getRoleColor = (roleId: string) => {
    const colors: Record<string, string> = {
      expert: "#4f46e5", // 인디고
      fact_checker: "#16a34a", // 그린
      philosopher: "#9333ea", // 보라
      scientist: "#0891b2", // 시안
      analyst: "#dc2626", // 레드
      economist: "#ca8a04", // 앰버
      strategist: "#0b4e70", // 스카이 블루
      historian: "#7c3aed", // 바이올렛
      critic: "#be185d", // 핑크
      default: "#6b7280", // 그레이
    };
    return colors[roleId] || colors.default;
  };

  return (
    <article
      className={styles.conversationCard}
      data-role={record.perspective || "expert"}
    >
      <header className={styles.cardHeader}>
        <div className={styles.modelInfo}>
          <h3 className={styles.modelName}>{record.model}</h3>
          <div
            className={styles.roleBadge}
            style={{ backgroundColor: getRoleColor(record.perspective) }}
          >
            {record.role}
          </div>
        </div>
        {record.stage !== undefined && (
          <div className={styles.stageInfo}>
            <span className={styles.stageNumber}>단계 {record.stage + 1}</span>
          </div>
        )}
      </header>

      <div className={styles.cardContent}>
        <MarkdownRenderer>{record.content}</MarkdownRenderer>
      </div>

      <footer className={styles.cardFooter}>
        <div className={styles.timestamp}>응답 순서 {index + 1}</div>
      </footer>
    </article>
  );
};

export default ConversationCard;
