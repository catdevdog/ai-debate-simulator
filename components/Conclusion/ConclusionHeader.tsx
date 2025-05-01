// src/components/Conclusion/ConclusionHeader.tsx
import React from "react";
// CSS 모듈 경로 주의! - 실제 page.module.scss 위치에 맞게 조정 필요
import styles from "../../app/conclusion-process/page.module.scss";
import {
  MAX_CONVERSATION_STAGES,
  getStageDescription,
} from "@/lib/conclusionUtils";

interface Props {
  subject: string;
  conversationStage: number;
  isLoading: boolean; // 현재 '단계' 진행 중 로딩 여부
}

const ConclusionHeader: React.FC<Props> = ({
  subject,
  conversationStage,
  isLoading,
}) => {
  return (
    <div className={styles.header}>
      <h1>결론 도출 프로세스</h1>
      <h2>주제: {subject}</h2>
      <div className={styles.progressIndicator}>
        <div className={styles.progressSteps}>
          <div className={styles.stageLabel}>
            현재 단계: {getStageDescription(conversationStage)}
          </div>
          {Array.from({ length: MAX_CONVERSATION_STAGES + 1 }).map(
            (_, index) => (
              <div
                key={index}
                className={`${styles.progressStep} ${
                  index < conversationStage
                    ? styles.completed // 완료된 단계
                    : index === conversationStage && !isLoading
                    ? styles.active // 현재 활성 단계 (로딩 아님)
                    : index === conversationStage && isLoading
                    ? styles.current // 현재 로딩 중인 단계
                    : "" // 아직 도달 못한 단계
                }`}
              >
                <span>
                  {index < MAX_CONVERSATION_STAGES
                    ? `단계 ${index + 1}`
                    : "결론"}
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ConclusionHeader;
