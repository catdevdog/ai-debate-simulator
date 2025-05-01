// src/components/Conclusion/ConclusionControls.tsx
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

  const getContinueButtonText = () => {
    if (isLoading && !isGeneratingFinalConclusion) return "AI 응답 중...";
    if (isGeneratingFinalConclusion) return "최종 결론 생성 중...";
    if (!isConclusionFinished && conversationStage >= MAX_CONVERSATION_STAGES)
      return "최종 결론 도출";
    if (!isConclusionFinished) return "다음 의견 요청";
    return "완료";
  };

  return (
    <div className={styles.controls}>
      <button
        onClick={onContinue}
        disabled={isLoading || isConclusionFinished}
        className={styles.button}
      >
        {getContinueButtonText()}
      </button>
      <button
        onClick={onStartAuto}
        className={styles.button}
        disabled={isLoading || isConclusionFinished || autoProgressEnabled}
      >
        자동 진행 시작
      </button>
      <button
        onClick={onStopAuto}
        className={styles.button}
        disabled={!autoProgressEnabled}
      >
        자동 진행 중지
      </button>
      <button
        onClick={() => router.push("/conclusion-setup")}
        className={styles.buttonSecondary}
        disabled={isLoading}
      >
        설정으로 돌아가기
      </button>
    </div>
  );
};

export default ConclusionControls;
