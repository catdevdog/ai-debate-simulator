"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDebateStore } from "@/lib/store/useDebateStore";
import { AI } from "@/api/ai";
import styles from "./page.module.scss";
import MarkdownRenderer from "@/components/MarkdownRenderer";

// 전문가 역할에 따른 시스템 프롬프트 정의
const expertisePrompts: Record<string, string> = {
  analyst:
    "당신은 데이터 분석가입니다. 데이터와 통계를 기반으로 간결하게 의견을 제시하세요.",
  economist:
    "당신은 경제 전문가입니다. 경제 이론과 시장 역학 관점에서 간결하게 의견을 제시하세요.",
  strategist:
    "당신은 전략가입니다. 장기적 관점에서 간결하게 의견을 제시하세요.",
  historian:
    "당신은 역사 전문가입니다. 역사적 패턴과 과거 사례를 기반으로 간결하게 의견을 제시하세요.",
  critic: "당신은 비평가입니다. 비판적 관점에서 간결하게 의견을 제시하세요.",
};

// 역할 ID에 따른 한글 이름
const roleNames: Record<string, string> = {
  analyst: "데이터 분석가",
  economist: "경제 전문가",
  strategist: "전략가",
  historian: "역사 전문가",
  critic: "비평가",
};

export default function ConclusionProcess() {
  const router = useRouter();
  const {
    subject,
    conclusionSetting,
    conclusionRecord,
    currentModel,
    isLoading,
    isConclusionFinished,
    finalConclusion,

    setCurrentModel,
    setIsLoading,
    setError,
    addConclusionRecord,
    setIsConclusionFinished,
    setFinalConclusion,
  } = useDebateStore();

  // 로컬 상태
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [conversationStage, setConversationStage] = useState<number>(0);
  const [isGeneratingFinalConclusion, setIsGeneratingFinalConclusion] =
    useState<boolean>(false);
  const [modelRoles, setModelRoles] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [discussionTopic, setDiscussionTopic] = useState<string>("");
  const autoProgressRef = useRef(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRY = 2;
  const MAX_CONVERSATION_STAGES = 3; // 대화 단계 제한

  // 카드 뷰/리스트 뷰 전환
  const [viewMode, setViewMode] = useState<"card" | "list">("card");

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    if (subject === "") {
      alert("주제를 설정해주세요.");
      router.push("/conclusion-setup");
      return;
    }

    // 모델별 역할 임의 할당 (실제로는 이전 설정 페이지에서 가져와야 함)
    const roles: Record<string, string> = {};
    const roleOptions = Object.keys(expertisePrompts);

    conclusionSetting.models.forEach((model, index) => {
      roles[model] = roleOptions[index % roleOptions.length];
    });

    setModelRoles(roles);

    if (conclusionSetting.models.length > 0) {
      setCurrentModel(conclusionSetting.models[0]);
    }

    // 초기 토론 주제는 사용자가 입력한 주제
    setDiscussionTopic(subject);
  }, [subject, router, conclusionSetting.models, setCurrentModel]);

  // 에러 메시지 표시 타이머
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // 자동 진행 이펙트
  useEffect(() => {
    if (!autoProgressRef.current || isLoading || isConclusionFinished) return;

    // 대화 단계가 최대치에 도달한 경우 최종 결론으로 진행
    if (conversationStage >= MAX_CONVERSATION_STAGES) {
      if (!finalConclusion && !isGeneratingFinalConclusion) {
        generateFinalConclusion();
      }
      return;
    }

    // 모든 모델이 현재 대화 단계에서 발언한 경우 다음 단계로
    const modelsInCurrentStage = conclusionRecord.filter(
      (record) => record.stage === conversationStage
    );

    if (modelsInCurrentStage.length >= conclusionSetting.models.length) {
      // 다음 대화 단계로 이동
      setConversationStage((prev) => prev + 1);
      setCurrentStep(0);
      if (conclusionSetting.models.length > 0) {
        setCurrentModel(conclusionSetting.models[0]);
      }
    } else {
      // 현재 단계에서 다음 모델의 응답 요청
      const timer = setTimeout(handleAIResponse, 1000);
      return () => clearTimeout(timer);
    }
  }, [
    isLoading,
    currentStep,
    conversationStage,
    isConclusionFinished,
    conclusionSetting.models.length,
    finalConclusion,
    isGeneratingFinalConclusion,
    conclusionRecord,
  ]);

  // 뷰 모드 전환 함수
  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "card" ? "list" : "card"));
  };

  // 대화 단계별 프롬프트 생성
  const createConversationPrompt = (stage: number) => {
    const model = currentModel;
    const role = modelRoles[model] || "analyst";
    const expertise = expertisePrompts[role] || "";

    // 이전 대화 내용 수집
    const previousMessages = conclusionRecord
      .map((record) => `${record.model} (${record.role}): ${record.content}`)
      .join("\n\n");

    // 각 단계별 지시사항
    let stageInstruction = "";
    if (stage === 0) {
      // 첫 단계: 주제에 대한 초기 의견
      stageInstruction = `주제에 대한 초기 의견을 3문장 이내로 제시하세요. 다른 전문가들이 논의할 수 있는 핵심적인 관점을 짧게 제시하는 것이 중요합니다.`;
      // 주제 포함
      stageInstruction = `${stageInstruction}\n\n현재 논의 주제: ${discussionTopic}`;
    } else if (stage === MAX_CONVERSATION_STAGES - 1) {
      // 마지막 단계: 합의점 찾기
      stageInstruction = `지금까지의 논의를 바탕으로 가장 합리적인 결론 방향을 3문장 이내로 제안하세요. 다른 전문가들의 의견 중 동의하는 부분을 언급하고 최종 결론을 위한 방향을 제시하세요.`;
    } else {
      // 중간 단계: 다른 의견에 반응
      stageInstruction = `이전 의견들에 대한 당신의 반응을 3문장 이내로 제시하세요. 동의하는 부분과 추가하고 싶은 관점을 간결하게 언급하세요.`;
    }

    // 최종 프롬프트 구성
    let prompt = `주제: ${subject}\n\n`;
    prompt += `${expertise}\n\n`;

    if (previousMessages) {
      prompt += `이전 대화 내용:\n\n${previousMessages}\n\n`;
    }

    prompt += `당신은 ${model} 모델로, ${
      roleNames[role] || role
    }의 관점에서 대화에 참여하고 있습니다.\n\n`;
    prompt += stageInstruction;
    prompt += `\n\n반드시 3문장 이내의 간결한 답변으로 작성하세요. 장황한 설명이나 불필요한 인사말은 생략하고 핵심만 말하세요.`;

    return prompt;
  };

  // 최종 결론 프롬프트 생성
  const createFinalConclusionPrompt = () => {
    // 토론 내용 정리
    const discussionContent = conclusionRecord
      .map((record) => `${record.model} (${record.role}): ${record.content}`)
      .join("\n\n");

    let prompt = `주제: ${subject}\n\n`;
    prompt += `지금까지의 전문가 토론 내용:\n\n${discussionContent}\n\n`;
    prompt += `당신은 ${conclusionSetting.finalModel} 모델입니다. 위의 다양한 전문가들이 나눈 대화를 바탕으로 최종 결론을 도출해주세요.\n\n`;
    prompt += `결론에는 다음 사항을 명확히 포함해주세요:\n`;
    prompt += `1. 토론에서 나온 주요 관점들의 간략한 요약\n`;
    prompt += `2. 가장 설득력 있는 주장과 그 이유\n`;
    prompt += `3. 최종 결론 - 명확하게 "결론적으로, ~이다"라는 형식으로 제시\n`;

    if (conclusionSetting.requireEvidence) {
      prompt += `4. 이 결론을 지지하는 핵심 근거\n`;
    }

    prompt += `\n결론은 객관적이고 명확해야 하며, 가장 타당한 하나의 결론을 도출해주세요. 여러 가능성을 나열하는 방식은 피해주세요.`;

    return prompt;
  };

  // AI 응답 처리
  const handleAIResponse = async () => {
    const model = currentModel;
    const role = modelRoles[model] || "analyst";

    try {
      setIsLoading(true);
      setRetryCount(0); // 재시도 카운트 초기화

      // 프롬프트 생성
      const prompt = createConversationPrompt(conversationStage);

      // AI 응답 가져오기 - 모드와 역할 전달
      const response = await AI(model, prompt, "Conclusion", role);

      // 오류 응답 확인
      if (response.startsWith("[") && response.includes("오류")) {
        throw new Error(response);
      }

      // 응답 기록 추가 (단계 정보 포함)
      addConclusionRecord({
        model,
        role: roleNames[role] || role,
        perspective: role,
        content: response,
        stage: conversationStage, // 대화 단계 정보 추가
      });

      // 다음 단계로 진행
      setCurrentStep((prev) => prev + 1);

      // 다음 모델로 전환
      const nextModelIndex =
        (currentStep + 1) % conclusionSetting.models.length;
      setCurrentModel(conclusionSetting.models[nextModelIndex]);

      // 모든 모델이 현재 단계에서 응답했는지 확인
      if (currentStep + 1 >= conclusionSetting.models.length) {
        // 다음 대화 단계로 이동
        setConversationStage((prev) => prev + 1);
        setCurrentStep(0);

        // 대화 단계가 최대치에 도달한 경우
        if (conversationStage + 1 >= MAX_CONVERSATION_STAGES) {
          if (autoProgressRef.current) {
            generateFinalConclusion();
          }
        }
      }
    } catch (err) {
      await handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 최종 결론 생성
  const generateFinalConclusion = async () => {
    try {
      setIsGeneratingFinalConclusion(true);
      setIsLoading(true);

      // 최종 결론 모델 설정
      const finalModel = conclusionSetting.finalModel;

      // 최종 결론 프롬프트 생성
      const prompt = createFinalConclusionPrompt();

      // AI 응답 가져오기 - 결론 모드로 전달하고 역할은 빈 문자열(최종 결론용)
      const response = await AI(finalModel, prompt, "Conclusion", "");

      // 오류 응답 확인
      if (response.startsWith("[") && response.includes("오류")) {
        throw new Error(response);
      }

      // 결론 설정
      setFinalConclusion(response);

      // 결론 도출 완료
      setIsConclusionFinished(true);
      autoProgressRef.current = false;
    } catch (err) {
      await handleError(err);
    } finally {
      setIsLoading(false);
      setIsGeneratingFinalConclusion(false);
    }
  };

  // 오류 처리
  const handleError = async (err: unknown) => {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("AI 응답 오류:", errorMsg);

    // 전역 오류 상태 설정
    setError(errorMsg);
    setErrorMessage(errorMsg);

    // 자동 재시도 로직 (최대 2번)
    if (retryCount < MAX_RETRY && autoProgressRef.current) {
      setRetryCount((prevCount) => prevCount + 1);
      setErrorMessage(`응답 오류, ${MAX_RETRY - retryCount}회 재시도 중...`);

      // 1.5초 후 재시도
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (isGeneratingFinalConclusion) {
        return generateFinalConclusion();
      } else {
        return handleAIResponse();
      }
    }

    // 최대 재시도 횟수 초과 시 자동 진행 중지
    if (retryCount >= MAX_RETRY) {
      autoProgressRef.current = false;
    }
  };

  // 자동 토론 제어 함수들
  const startAutoProgress = () => {
    if (!isConclusionFinished && !isLoading) {
      autoProgressRef.current = true;

      // 대화 단계가 최대치에 도달한 경우 최종 결론으로 진행
      if (conversationStage >= MAX_CONVERSATION_STAGES) {
        if (!finalConclusion) {
          generateFinalConclusion();
        }
      } else {
        handleAIResponse();
      }
    }
  };

  const stopAutoProgress = () => {
    autoProgressRef.current = false;
  };

  // 수동 진행 함수
  const continueConversation = () => {
    if (!isLoading) {
      if (conversationStage >= MAX_CONVERSATION_STAGES) {
        generateFinalConclusion();
      } else {
        handleAIResponse();
      }
    }
  };

  // 진행 상태 표시 문구
  const getStageDescription = () => {
    if (conversationStage === 0) return "초기 의견 제시";
    if (conversationStage === MAX_CONVERSATION_STAGES - 1) return "합의점 찾기";
    if (conversationStage >= MAX_CONVERSATION_STAGES) return "최종 결론 도출";
    return `논의 단계 ${conversationStage}`;
  };

  // 렌더링
  return (
    <div className={styles.container}>
      <div className={styles.conclusionContainer}>
        {/* 헤더 섹션 */}
        <div className={styles.header}>
          <h1>결론 도출 프로세스</h1>
          <h2>주제: {subject}</h2>

          <div className={styles.progressIndicator}>
            <div className={styles.progressSteps}>
              <div className={styles.stageLabel}>
                현재 단계: {getStageDescription()}
              </div>
              {Array.from({ length: MAX_CONVERSATION_STAGES + 1 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className={`${styles.progressStep} ${
                      index < conversationStage
                        ? styles.completed
                        : index === conversationStage && isLoading
                        ? styles.current
                        : index === conversationStage
                        ? styles.active
                        : ""
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

          <div className={styles.controls}>
            <button
              onClick={continueConversation}
              disabled={isLoading || isConclusionFinished}
              className={styles.button}
            >
              {isLoading && !isGeneratingFinalConclusion
                ? "AI 응답 중..."
                : conversationStage >= MAX_CONVERSATION_STAGES
                ? "최종 결론 도출"
                : "다음 의견 요청"}
            </button>

            <button
              onClick={startAutoProgress}
              className={styles.button}
              disabled={
                isLoading || isConclusionFinished || autoProgressRef.current
              }
            >
              자동 진행 시작
            </button>

            <button
              onClick={stopAutoProgress}
              className={styles.button}
              disabled={!autoProgressRef.current}
            >
              자동 진행 중지
            </button>

            <button
              onClick={toggleViewMode}
              className={styles.viewToggleButton}
            >
              {viewMode === "card" ? "리스트 뷰" : "카드 뷰"}
            </button>

            <button
              onClick={() => router.push("/conclusion-setup")}
              className={styles.buttonSecondary}
            >
              설정으로 돌아가기
            </button>
          </div>

          {/* 에러 메시지 표시 */}
          {errorMessage && (
            <div className={styles.errorMessage}>
              <span>{errorMessage}</span>
              <button onClick={continueConversation} disabled={isLoading}>
                재시도
              </button>
            </div>
          )}
        </div>

        {/* 대화 컨텐츠 섹션 */}
        <div className={`${styles.contentSection} ${styles[viewMode]}`}>
          {conclusionRecord.map((record, index) => (
            <div
              key={index}
              className={`${styles.analysisCard} ${
                index % 2 === 0 ? styles.left : styles.right
              }`}
            >
              <div className={styles.analysisHeader}>
                <h3>{record.model}</h3>
                <span className={styles.roleBadge}>{record.role}</span>
                {record.stage !== undefined && (
                  <span className={styles.stageBadge}>
                    단계 {record.stage + 1}
                  </span>
                )}
              </div>
              <div className={styles.analysisContent}>
                <MarkdownRenderer>{record.content}</MarkdownRenderer>
              </div>
            </div>
          ))}

          {/* 로딩 메시지 */}
          {isLoading && !isGeneratingFinalConclusion && (
            <div className={styles.loadingCard}>
              <div className={styles.loadingHeader}>
                <h3>{currentModel}</h3>
                <span className={styles.roleBadge}>
                  {roleNames[modelRoles[currentModel] || "analyst"] || "분석가"}
                </span>
                <span className={styles.stageBadge}>
                  단계 {conversationStage + 1}
                </span>
              </div>

              <div className={styles.loadingContent}>
                <div className={styles.loadingAnimation}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <p>생각 중...</p>
              </div>
            </div>
          )}

          {/* 최종 결론 로딩 */}
          {isGeneratingFinalConclusion && (
            <div className={styles.finalConclusionLoading}>
              <div className={styles.loadingAnimation}>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <h3>최종 결론 도출 중...</h3>
              <p>
                {conclusionSetting.finalModel} 모델이 모든 대화를 종합하여
                결론을 생성하고 있습니다.
              </p>
            </div>
          )}

          {/* 최종 결론 표시 */}
          {finalConclusion && (
            <div className={styles.finalConclusionCard}>
              <div className={styles.finalConclusionHeader}>
                <h3>최종 결론</h3>
                <span className={styles.modelBadge}>
                  {conclusionSetting.finalModel}
                </span>
              </div>

              <div className={styles.finalConclusionContent}>
                <MarkdownRenderer>{finalConclusion}</MarkdownRenderer>
              </div>

              <div className={styles.actionButtons}>
                <button
                  onClick={() => router.push("/")}
                  className={styles.homeButton}
                >
                  처음으로 돌아가기
                </button>
                <button
                  onClick={() => {
                    // 결과를 클립보드에 복사
                    navigator.clipboard
                      .writeText(finalConclusion)
                      .then(() => alert("결론이 클립보드에 복사되었습니다."))
                      .catch(() => alert("클립보드 복사에 실패했습니다."));
                  }}
                  className={styles.copyButton}
                >
                  결론 복사하기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
