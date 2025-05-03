import React from "react";
import { useRouter } from "next/navigation";
import styles from "../../app/conclusion-process/page.module.scss";
import { MAX_CONVERSATION_STAGES } from "@/lib/conclusionUtils";

interface Props {
  isLoading: boolean;
  isGeneratingFinalConclusion: boolean;
  isConclusionFinished: boolean;
  conversationStage: number;
  autoProgressEnabled: boolean;
  onContinue: () => void;
  onStartAuto: () => void;
  onStopAuto: () => void;
}

const ConclusionControls: React.FC<Props> = ({
  isLoading,
  isGeneratingFinalConclusion,
  isConclusionFinished,
  conversationStage,
  autoProgressEnabled,
  onContinue,
  onStartAuto,
  onStopAuto,
}) => {
  const router = useRouter();

  const getMainButtonText = () => {
    if (isLoading && !isGeneratingFinalConclusion) return "분석 진행 중...";
    if (isGeneratingFinalConclusion) return "최종 결론 도출 중...";
    if (!isConclusionFinished && conversationStage >= MAX_CONVERSATION_STAGES)
      return "최종 결론 생성하기";
    if (!isConclusionFinished) return "다음 단계 진행";
    return "분석 완료";
  };

  return (
    <div className={styles.controls}>
      <div className={styles.primaryControls}>
        <button
          onClick={onContinue}
          disabled={isLoading || isConclusionFinished}
          className={styles.primaryButton}
        >
          {getMainButtonText()}
        </button>
      </div>

      <div className={styles.secondaryControls}>
        <button
          onClick={onStartAuto}
          className={`${styles.secondaryButton} ${
            autoProgressEnabled ? styles.disabled : ""
          }`}
          disabled={isLoading || isConclusionFinished || autoProgressEnabled}
        >
          자동 진행
        </button>
        <button
          onClick={onStopAuto}
          className={`${styles.secondaryButton} ${
            !autoProgressEnabled ? styles.disabled : ""
          }`}
          disabled={!autoProgressEnabled}
        >
          자동 중지
        </button>
      </div>

      <div className={styles.navigationControls}>
        <button
          onClick={() => router.push("/conclusion-setup")}
          className={styles.navigationButton}
          disabled={isLoading}
        >
          설정 화면으로
        </button>
      </div>
    </div>
  );
};

export default ConclusionControls;
