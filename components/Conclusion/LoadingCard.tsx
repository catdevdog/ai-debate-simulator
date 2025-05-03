import React from "react";
import styles from "../../app/conclusion-process/page.module.scss";

interface Props {
  model: string;
  role: string;
  stage: number;
  modelRoleKey: string;
}

const LoadingCard: React.FC<Props> = ({ model, role, stage, modelRoleKey }) => {
  return (
    <article
      className={`${styles.conversationCard} ${styles.loadingCard}`}
      data-role={modelRoleKey}
    >
      <header className={styles.cardHeader}>
        <div className={styles.modelInfo}>
          <h3 className={styles.modelName}>{model}</h3>
          <div className={styles.roleBadge}>{role}</div>
        </div>
        <div className={styles.stageInfo}>
          <span className={styles.stageNumber}>단계 {stage + 1}</span>
        </div>
      </header>

      <div className={styles.cardContent}>
        <div className={styles.loadingAnimation}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>분석 중입니다...</p>
        </div>
      </div>
    </article>
  );
};

export default LoadingCard;
