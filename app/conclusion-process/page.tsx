// src/app/conclusion-process/page.tsx (기존 파일 대체)
"use client"; // 클라이언트 컴포넌트 명시

import React from "react";
import { useConclusionProcess } from "@/hooks/useConclusionProcess";
import { useViewMode } from "@/hooks/useViewMode";
// CSS 모듈 임포트 (이 파일과 같은 위치에 있다고 가정)
import styles from "./page.module.scss";

// 분리된 컴포넌트들 임포트 - 실제 경로에 맞게 수정하세요.
import ConclusionHeader from "@/components/Conclusion/ConclusionHeader";
import ConclusionControls from "@/components/Conclusion/ConclusionControls";
import ErrorMessageDisplay from "@/components/Conclusion/ErrorMessageDisplay";
import ConversationCard from "@/components/Conclusion/ConversationCard";
import LoadingCard from "@/components/Conclusion/LoadingCard";
import FinalConclusionLoading from "@/components/Conclusion/FinalConclusionLoading";
import FinalConclusionDisplay from "@/components/Conclusion/FinalConclusionDisplay";
// import { conclusionUtils } from "@/lib/conclusionUtils"; // 필요 시 임포트

export default function ConclusionProcess() {
  // 커스텀 훅 사용
  const {
    subject,
    conclusionSetting,
    conclusionRecord,
    currentModel,
    isLoading,
    isConclusionFinished,
    finalConclusion,
    conversationStage,
    isGeneratingFinalConclusion,
    errorMessage,
    autoProgressEnabled,
    startAutoProgress,
    stopAutoProgress,
    continueConversation, // 수동 진행 및 재시도 핸들러
    getCurrentRoleName,
  } = useConclusionProcess();

  const { viewMode, expandedCards, toggleViewMode, toggleCardExpand } =
    useViewMode();

  // 로딩 카드에 필요한 현재 모델의 역할 ID 가져오기 (null 체크 추가)
  const currentModelRoleId = currentModel
    ? conclusionSetting.modelRoles[currentModel] || "expert"
    : "expert";

  // subject가 아직 로드되지 않았거나 설정이 없으면 로딩 상태나 빈 화면 표시 (선택적)
  if (!subject || !conclusionSetting) {
    return <div>Loading settings...</div>; // 혹은 스켈레톤 UI
  }

  return (
    <div className={styles.container}>
      <div className={styles.conclusionContainer}>
        {/* 헤더 */}
        <ConclusionHeader
          subject={subject}
          conversationStage={conversationStage}
          // 현재 '단계'가 로딩 중인지 여부 전달 (최종 결론 생성 로딩과는 별개)
          isLoading={
            isLoading &&
            !isGeneratingFinalConclusion &&
            conversationStage < MAX_CONVERSATION_STAGES
          }
        />

        {/* 컨트롤러 */}
        <ConclusionControls
          isLoading={isLoading} // 전반적인 로딩 상태
          isGeneratingFinalConclusion={isGeneratingFinalConclusion}
          isConclusionFinished={isConclusionFinished}
          conversationStage={conversationStage}
          autoProgressEnabled={autoProgressEnabled}
          viewMode={viewMode}
          onContinue={continueConversation}
          onStartAuto={startAutoProgress}
          onStopAuto={stopAutoProgress}
          onToggleView={toggleViewMode}
        />

        {/* 에러 메시지 */}
        <ErrorMessageDisplay
          errorMessage={errorMessage}
          isLoading={isLoading}
          onRetry={continueConversation} // 재시도 핸들러 연결
        />

        {/* 대화 내용 섹션 */}
        <div className={`${styles.contentSection} ${styles[viewMode]}`}>
          {/* 이전 대화 기록 렌더링 */}
          {conclusionRecord.map((record, index) => (
            <ConversationCard
              key={`${record.model}-${index}`} // 더 고유한 key 사용 권장
              record={record}
              index={index}
              viewMode={viewMode}
              isExpanded={expandedCards.includes(index)}
              onToggleExpand={toggleCardExpand}
            />
          ))}

          {/* 다음 AI 응답 로딩 표시 */}
          {isLoading &&
            !isGeneratingFinalConclusion &&
            !isConclusionFinished &&
            currentModel && (
              <LoadingCard
                model={currentModel}
                role={getCurrentRoleName()}
                stage={conversationStage}
                modelRoleKey={currentModelRoleId}
              />
            )}

          {/* 최종 결론 생성 로딩 표시 */}
          {isGeneratingFinalConclusion && (
            <FinalConclusionLoading
              finalModelName={conclusionSetting.finalModel}
            />
          )}

          {/* 최종 결론 표시 */}
          {finalConclusion &&
            !isGeneratingFinalConclusion && ( // 최종결론 생성중 아닐때만 표시
              <FinalConclusionDisplay
                conclusion={finalConclusion}
                model={conclusionSetting.finalModel}
              />
            )}
        </div>
      </div>
    </div>
  );
}

// MAX_CONVERSATION_STAGES를 page.tsx에서도 사용하므로 정의 혹은 import 필요
import { MAX_CONVERSATION_STAGES } from "@/lib/conclusionUtils";
