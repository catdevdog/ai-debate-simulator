// src/app/conclusion-process/page.tsx
"use client";

import React from "react";
import { useConclusionProcess } from "@/hooks/useConclusionProcess";
import styles from "./page.module.scss";

// 분리된 컴포넌트들 임포트
import ConclusionHeader from "@/components/Conclusion/ConclusionHeader";
import ConclusionControls from "@/components/Conclusion/ConclusionControls";
import ErrorMessageDisplay from "@/components/Conclusion/ErrorMessageDisplay";
import ConversationCard from "@/components/Conclusion/ConversationCard";
import LoadingCard from "@/components/Conclusion/LoadingCard";
import FinalConclusionLoading from "@/components/Conclusion/FinalConclusionLoading";
import FinalConclusionDisplay from "@/components/Conclusion/FinalConclusionDisplay";

import { MAX_CONVERSATION_STAGES } from "@/lib/conclusionUtils";

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
    continueConversation,
    getCurrentRoleName,
  } = useConclusionProcess();

  // 로딩 카드에 필요한 현재 모델의 역할 ID 가져오기
  const currentModelRoleId = currentModel
    ? conclusionSetting.modelRoles[currentModel] || "expert"
    : "expert";

  // subject가 아직 로드되지 않았거나 설정이 없으면 로딩 상태나 빈 화면 표시
  if (!subject || !conclusionSetting) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.conclusionContainer}>
        {/* 헤더 */}
        <ConclusionHeader
          subject={subject}
          conversationStage={conversationStage}
          isLoading={
            isLoading &&
            !isGeneratingFinalConclusion &&
            conversationStage < MAX_CONVERSATION_STAGES
          }
        />

        {/* 컨트롤러 */}
        <ConclusionControls
          isLoading={isLoading}
          isGeneratingFinalConclusion={isGeneratingFinalConclusion}
          isConclusionFinished={isConclusionFinished}
          conversationStage={conversationStage}
          autoProgressEnabled={autoProgressEnabled}
          onContinue={continueConversation}
          onStartAuto={startAutoProgress}
          onStopAuto={stopAutoProgress}
        />

        {/* 에러 메시지 */}
        <ErrorMessageDisplay
          errorMessage={errorMessage}
          isLoading={isLoading}
          onRetry={continueConversation}
        />

        {/* 대화 내용 섹션 */}
        <div className={styles.contentSection}>
          {/* 이전 대화 기록 렌더링 */}
          {conclusionRecord.map((record, index) => (
            <ConversationCard
              key={`${record.model}-${index}`}
              record={record}
              index={index}
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
          {finalConclusion && !isGeneratingFinalConclusion && (
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
