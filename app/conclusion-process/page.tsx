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

  const currentModelRoleId = currentModel
    ? conclusionSetting.modelRoles[currentModel] || "expert"
    : "expert";

  if (!subject || !conclusionSetting) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingAnimation}>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>설정을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.conclusionContainer}>
        {/* 헤더 섹션 */}
        <header className={styles.pageHeader}>
          <ConclusionHeader
            subject={subject}
            conversationStage={conversationStage}
            isLoading={
              isLoading &&
              !isGeneratingFinalConclusion &&
              conversationStage < MAX_CONVERSATION_STAGES
            }
          />
        </header>

        {/* 메인 컨텐츠 섹션 */}
        <main className={styles.mainContent}>
          {/* 컨트롤러 */}
          <section className={styles.controlSection}>
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
          </section>

          {/* 상태 메시지 섹션 */}
          {errorMessage && (
            <section className={styles.statusSection}>
              <ErrorMessageDisplay
                errorMessage={errorMessage}
                isLoading={isLoading}
                onRetry={continueConversation}
              />
            </section>
          )}

          {/* 대화 내용 섹션 */}
          <section className={styles.conversationSection}>
            <div className={styles.conversationList}>
              {/* 이전 대화 기록 */}
              {conclusionRecord.map((record, index) => (
                <ConversationCard
                  key={`${record.model}-${index}`}
                  record={record}
                  index={index}
                />
              ))}

              {/* 로딩 카드 */}
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

              {/* 최종 결론 로딩 */}
              {isGeneratingFinalConclusion && (
                <FinalConclusionLoading
                  finalModelName={conclusionSetting.finalModel}
                />
              )}

              {/* 최종 결론 */}
              {finalConclusion && !isGeneratingFinalConclusion && (
                <FinalConclusionDisplay
                  conclusion={finalConclusion}
                  model={conclusionSetting.finalModel}
                />
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
