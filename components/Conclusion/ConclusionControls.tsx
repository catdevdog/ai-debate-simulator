// src/components/Conclusion/ConclusionControls.tsx
import React from "react";
import { useRouter } from "next/navigation";
// CSS 모듈 경로 주의!
import styles from "../../app/conclusion-process/page.module.scss";
import type { ViewMode } from "@/hooks/useViewMode";
import { MAX_CONVERSATION_STAGES } from "@/lib/conclusionUtils";

interface Props {
  isLoading: boolean; // 전체 로딩 상태 (AI 응답 or 최종 결론 생성)
  isGeneratingFinalConclusion: boolean; // 최종 결론 생성 중 여부
  isConclusionFinished: boolean; // 전체 프로세스 완료 여부
  conversationStage: number; // 현재 대화 단계
  autoProgressEnabled: boolean; // 자동 진행 활성화 여부
  viewMode: ViewMode; // 현재 뷰 모드
  onContinue: () => void; // 다음 단계 진행 핸들러
  onStartAuto: () => void; // 자동 진행 시작 핸들러
  onStopAuto: () => void; // 자동 진행 중지 핸들러
  onToggleView: () => void; // 뷰 모드 전환 핸들러
}

const ConclusionControls: React.FC<Props> = ({
  isLoading,
  isGeneratingFinalConclusion,
  isConclusionFinished,
  conversationStage,
  autoProgressEnabled,
  viewMode,
  onContinue,
  onStartAuto,
  onStopAuto,
  onToggleView,
}) => {
  const router = useRouter();

  const getContinueButtonText = () => {
    if (isLoading && !isGeneratingFinalConclusion) return "AI 응답 중...";
    if (isGeneratingFinalConclusion) return "최종 결론 생성 중...";
    // 완료되지 않았고, 마지막 대화 단계 이상이면 '최종 결론 도출' 버튼
    if (!isConclusionFinished && conversationStage >= MAX_CONVERSATION_STAGES)
      return "최종 결론 도출";
    // 그 외에는 '다음 의견 요청'
    if (!isConclusionFinished) return "다음 의견 요청";
    // 완료되었으면 버튼 비활성화되므로 텍스트는 크게 중요하지 않음
    return "완료";
  };

  return (
    <div className={styles.controls}>
      <button
        onClick={onContinue}
        // 로딩 중이거나, 이미 완료되었으면 비활성화
        disabled={isLoading || isConclusionFinished}
        className={styles.button}
      >
        {getContinueButtonText()}
      </button>
      <button
        onClick={onStartAuto}
        className={styles.button}
        // 로딩 중, 완료됨, 이미 자동 진행 중이면 비활성화
        disabled={isLoading || isConclusionFinished || autoProgressEnabled}
      >
        자동 진행 시작
      </button>
      <button
        onClick={onStopAuto}
        className={styles.button}
        // 자동 진행 중이 아닐 때 비활성화
        disabled={!autoProgressEnabled}
      >
        자동 진행 중지
      </button>
      <button
        onClick={onToggleView}
        className={`${styles.viewToggleButton} ${styles[viewMode]}`}
        // 로딩 중에는 뷰 전환 방지 (선택적)
        disabled={isLoading}
      >
        {viewMode === "card" ? "리스트 뷰로 보기" : "카드 뷰로 보기"}
      </button>
      <button
        onClick={() => router.push("/conclusion-setup")}
        className={styles.buttonSecondary}
        // 로딩 중에는 설정으로 못 돌아가게 (선택적)
        disabled={isLoading}
      >
        설정으로 돌아가기
      </button>
    </div>
  );
};

export default ConclusionControls;
