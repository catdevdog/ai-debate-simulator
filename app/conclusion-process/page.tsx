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
    "당신은 데이터 분석가입니다. 객관적인 데이터와 통계를 기반으로 분석하고 핵심 인사이트를 제시하세요.",
  economist:
    "당신은 경제 전문가입니다. 경제 이론과 시장 역학 관점에서 핵심 인사이트를 제시하세요.",
  strategist:
    "당신은 전략가입니다. 장기적인 관점에서 전략적 함의와 핵심 인사이트를 제시하세요.",
  historian:
    "당신은 역사 전문가입니다. 역사적 패턴과 과거 사례를 기반으로 핵심 인사이트를 제시하세요.",
  critic:
    "당신은 비평가입니다. 비판적 관점에서 핵심 인사이트와 대안을 제시하세요.",
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
  const [isGeneratingFinalConclusion, setIsGeneratingFinalConclusion] =
    useState<boolean>(false);
  const [modelRoles, setModelRoles] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const autoProgressRef = useRef(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRY = 2;

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

    const allModelsDone = currentStep >= conclusionSetting.models.length;

    if (allModelsDone) {
      if (!finalConclusion && !isGeneratingFinalConclusion) {
        generateFinalConclusion();
      }
    } else {
      const timer = setTimeout(handleAIResponse, 1000);
      return () => clearTimeout(timer);
    }
  }, [
    isLoading,
    currentStep,
    isConclusionFinished,
    conclusionSetting.models.length,
    finalConclusion,
    isGeneratingFinalConclusion,
  ]);

  // 프롬프트 생성
  const createPrompt = (isFinalConclusion = false) => {
    if (isFinalConclusion) {
      // 최종 결론 도출을 위한 프롬프트
      let prompt = `주제: ${subject}\n\n`;

      // 다른 모델들의 분석 내용 추가
      prompt += "각 전문가의 분석:\n\n";

      conclusionRecord.forEach((record) => {
        prompt += `${record.model} (${record.role}의 관점):\n`;
        prompt += `${record.content}\n\n`;
      });

      prompt += `당신은 ${conclusionSetting.finalModel} 모델입니다. 위의 다양한 전문가 관점을 종합하여 주제에 대한 최종 결론을 도출해주세요. `;

      if (conclusionSetting.requireEvidence) {
        prompt += "결론에는 반드시 객관적인 근거를 포함해주세요. ";
      }

      prompt += "간결하면서도 명확한 결론을 제시하는 것이 중요합니다. ";
      prompt += "\n\n다음 형식으로 구조화된 결론을 제시해주세요:\n";
      prompt += "1. 요약: 주요 발견과 결론을 간략히 요약 (3-4문장)\n";
      prompt +=
        "2. 핵심 인사이트: 각 전문가의 주요 주장 중 가장 중요한 점들 (3-4개 항목)\n";
      prompt +=
        "3. 최종 결론: 가장 적절한 답변과 그 이유 (명확하고 간결하게)\n";
      prompt +=
        "4. 권장 사항: 구체적인 실행 방안이나 조언 (선택적, 필요한 경우)\n";

      return prompt;
    } else {
      // 각 모델의 전문가 분석을 위한 프롬프트
      const model = currentModel;
      const role = modelRoles[model] || "analyst";
      const expertise = expertisePrompts[role] || "";

      let prompt = `주제: ${subject}\n\n`;
      prompt += `${expertise}\n\n`;

      // 간결한 분석 요구
      prompt +=
        "분석은 간결하게 핵심만 작성해주세요. 불필요한 서론이나 장황한 설명은 피하고, 키 포인트를 중심으로 작성해주세요.\n\n";

      if (conclusionSetting.requireEvidence) {
        prompt +=
          "분석 시 객관적인 근거와 데이터를 포함해야 합니다. 가능한 경우 출처를 명시해주세요.\n\n";
      }

      // 이미 분석한 내용이 있으면 추가
      if (conclusionRecord.length > 0) {
        prompt += "이전 전문가 분석:\n\n";

        conclusionRecord.forEach((record) => {
          prompt += `${record.model} (${record.role}의 관점):\n`;
          prompt += `${record.content}\n\n`;
        });
      }

      prompt += `당신은 ${model} 모델로, ${
        roleNames[role] || role
      }의 관점에서 주제에 대한 분석을 제공해주세요. `;
      prompt +=
        "다른 전문가의 의견을 단순히 반복하지 말고, 자신만의 고유한 관점과 통찰을 제시하세요. ";
      prompt += "마크다운 형식으로 다음과 같이 작성해주세요:\n";
      prompt += "1. 핵심 인사이트 (2-3개 항목)\n";
      prompt += "2. 관련 데이터/근거 (간결하게)\n";
      prompt += "3. 결론적 견해 (1-2문장)\n";

      return prompt;
    }
  };

  // AI 응답 처리
  const handleAIResponse = async () => {
    const model = currentModel;
    const role = modelRoles[model] || "analyst";

    try {
      setIsLoading(true);
      setRetryCount(0); // 재시도 카운트 초기화

      // 프롬프트 생성
      const prompt = createPrompt(false);

      // AI 응답 가져오기 - 모드와 역할 전달
      const response = await AI(model, prompt, "Conclusion", role);

      // 오류 응답 확인
      if (response.startsWith("[") && response.includes("오류")) {
        throw new Error(response);
      }

      // 응답 기록 추가
      addConclusionRecord({
        model,
        role: roleNames[role] || role,
        perspective: role,
        content: response,
      });

      // 다음 단계로 진행
      setCurrentStep((prev) => prev + 1);

      // 다음 모델로 전환
      if (currentStep + 1 < conclusionSetting.models.length) {
        setCurrentModel(conclusionSetting.models[currentStep + 1]);
      }

      // 모든 모델이 응답했는지 확인
      if (currentStep + 1 >= conclusionSetting.models.length) {
        // 자동 진행 중이면 최종 결론 생성
        if (autoProgressRef.current) {
          generateFinalConclusion();
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
      const prompt = createPrompt(true);

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

      // 현재 단계에 따라 다음 작업 결정
      if (currentStep >= conclusionSetting.models.length) {
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

  // 수동 재시도 함수
  const retryResponse = () => {
    if (!isLoading) {
      if (isGeneratingFinalConclusion) {
        generateFinalConclusion();
      } else {
        handleAIResponse();
      }
    }
  };

  // 뷰 모드 전환
  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "card" ? "list" : "card"));
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
              {conclusionSetting.models.map((model, index) => (
                <div
                  key={model}
                  className={`${styles.progressStep} ${
                    index < currentStep
                      ? styles.completed
                      : index === currentStep && isLoading
                      ? styles.current
                      : index === currentStep
                      ? styles.active
                      : ""
                  }`}
                >
                  <span>{model}</span>
                </div>
              ))}
              <div
                className={`${styles.progressStep} ${
                  isGeneratingFinalConclusion
                    ? styles.current
                    : finalConclusion
                    ? styles.completed
                    : currentStep >= conclusionSetting.models.length
                    ? styles.active
                    : ""
                }`}
              >
                <span>최종 결론</span>
              </div>
            </div>
          </div>

          <div className={styles.controls}>
            <button
              onClick={handleAIResponse}
              disabled={
                isLoading ||
                isConclusionFinished ||
                currentStep >= conclusionSetting.models.length
              }
              className={styles.button}
            >
              {isLoading && !isGeneratingFinalConclusion
                ? "AI 응답 중..."
                : "다음 모델 분석"}
            </button>

            <button
              onClick={generateFinalConclusion}
              disabled={
                isLoading ||
                isConclusionFinished ||
                currentStep < conclusionSetting.models.length ||
                isGeneratingFinalConclusion
              }
              className={styles.button}
            >
              {isGeneratingFinalConclusion
                ? "결론 생성 중..."
                : "최종 결론 도출"}
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
              <button onClick={retryResponse} disabled={isLoading}>
                재시도
              </button>
            </div>
          )}
        </div>

        {/* 컨텐츠 섹션 */}
        <div className={`${styles.contentSection} ${styles[viewMode]}`}>
          {/* 각 모델의 분석 내용 - 카드 또는 리스트 뷰 */}
          {conclusionRecord.map((record, index) => (
            <div key={index} className={styles.analysisCard}>
              <div className={styles.analysisHeader}>
                <h3>{record.model}</h3>
                <span className={styles.roleBadge}>{record.role}</span>
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
              </div>

              <div className={styles.loadingContent}>
                <div className={styles.loadingAnimation}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <p>분석 중입니다...</p>
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
                {conclusionSetting.finalModel} 모델이 모든 분석을 종합하여
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
