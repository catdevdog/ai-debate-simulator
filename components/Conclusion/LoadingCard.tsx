// src/components/Conclusion/LoadingCard.tsx
import React from "react";
// CSS 모듈 경로 주의!
import styles from "../../app/conclusion-process/page.module.scss";

interface Props {
  model: string; // 현재 응답을 기다리는 모델 이름
  role: string; // 해당 모델의 역할 이름
  stage: number; // 현재 진행 중인 대화 단계
  modelRoleKey: string; // data-role 속성에 사용할 역할 ID (e.g., 'expert', 'critic')
}

const LoadingCard: React.FC<Props> = ({ model, role, stage, modelRoleKey }) => {
  return (
    // CSS 스타일링 위한 data-role 적용
    <div
      className={`${styles.loadingCard} ${styles.analysisCard}`}
      data-role={modelRoleKey}
    >
      <div className={styles.analysisHeader}>
        {" "}
        {/* 헤더 스타일 재사용 */}
        <h3>
          <span className={styles.roleBadge}>{role}</span>
          {model}
        </h3>
        <span className={styles.stageBadge}>단계 {stage + 1}</span>
      </div>
      <div className={styles.loadingContent}>
        {" "}
        {/* 로딩 전용 컨텐츠 */}
        <div className={styles.loadingAnimation}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p>생각 중...</p>
      </div>
    </div>
  );
};

export default LoadingCard;
