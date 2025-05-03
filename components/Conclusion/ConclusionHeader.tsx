// ConclusionHeader.tsx 수정 버전
import React from "react";
import styles from "../../app/conclusion-process/page.module.scss";
import {
  MAX_CONVERSATION_STAGES,
  getStageDescription,
} from "@/lib/conclusionUtils";

interface Props {
  subject: string;
  conversationStage: number;
  isLoading: boolean;
}

const ConclusionHeader: React.FC<Props> = ({
  subject,
  conversationStage,
  isLoading,
}) => {
  // 단계별 이름을 정의
  const getStepLabel = (index: number) => {
    if (index >= MAX_CONVERSATION_STAGES) return "최종 결론";

    const stepLabels = ["초기 의견", "심층 분석", "관점 통합"];

    return stepLabels[index] || `단계 ${index + 1}`;
  };

  return (
    <div className={styles.header}>
      <div className={styles.headerContent}>
        <h1 className={styles.title}>결론 도출 분석</h1>
        <h2 className={styles.subtitle}>
          <span className={styles.subjectLabel}>분석 주제</span>
          <span className={styles.subjectText}>{subject}</span>
        </h2>
      </div>

      <div className={styles.progressIndicator}>
        {/* 현재 단계 표시 */}
        <div className={styles.stageIndicator}>
          <span className={styles.stageLabel}>
            {conversationStage >= MAX_CONVERSATION_STAGES
              ? "최종 결론 단계"
              : `${conversationStage + 1}/${MAX_CONVERSATION_STAGES} 단계`}
          </span>
          <span className={styles.stageDescription}>
            {getStageDescription(conversationStage)}
          </span>
        </div>

        {/* 진행 바 */}
        <div className={styles.progressBar}>
          <div
            className={styles.progressBarFill}
            style={{
              width: `${Math.min(
                (conversationStage / MAX_CONVERSATION_STAGES) * 100,
                100
              )}%`,
            }}
          />
        </div>

        {/* 단계별 마커 */}
        <div className={styles.progressSteps}>
          {Array.from({ length: MAX_CONVERSATION_STAGES + 1 }).map(
            (_, index) => (
              <div
                key={index}
                className={`${styles.progressStep} ${
                  index < conversationStage
                    ? styles.completed
                    : index === conversationStage && !isLoading
                    ? styles.active
                    : index === conversationStage && isLoading
                    ? styles.current
                    : ""
                }`}
              >
                <div className={styles.stepMarker}>{index + 1}</div>
                <span className={styles.stepText}>{getStepLabel(index)}</span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ConclusionHeader;
