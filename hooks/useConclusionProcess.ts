// src/hooks/useConclusionProcess.ts (또는 hooks/useConclusionProcess.ts)
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
// 실제 경로에 맞게 수정하세요.
import { useDebateStore } from "@/lib/store/useDebateStore";
import { AI } from "@/api/ai";
import {
  MAX_RETRY,
  MAX_CONVERSATION_STAGES,
  createConversationPrompt,
  createFinalConclusionPrompt,
  getRoleName,
} from "@/lib/conclusionUtils";

export const useConclusionProcess = () => {
  const router = useRouter();
  const store = useDebateStore();
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
    setError, // 스토어의 setError 사용
    addConclusionRecord,
    setIsConclusionFinished,
    setFinalConclusion,
  } = store;

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [conversationStage, setConversationStage] = useState<number>(0);
  const [isGeneratingFinalConclusion, setIsGeneratingFinalConclusion] =
    useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [discussionTopic, setDiscussionTopic] = useState<string>("");
  const autoProgressRef = useRef(false);
  const [retryCount, setRetryCount] = useState(0);

  // 초기화
  useEffect(() => {
    if (!subject) {
      alert("주제를 설정해주세요.");
      router.push("/conclusion-setup");
      return;
    }
    if (conclusionSetting.models.length > 0 && !currentModel) {
      // currentModel이 없을 때만 설정
      setCurrentModel(conclusionSetting.models[0]);
    }
    if (!discussionTopic) {
      // discussionTopic이 없을 때만 설정
      setDiscussionTopic(subject);
    }
  }, [
    subject,
    router,
    conclusionSetting.models,
    setCurrentModel,
    currentModel,
    discussionTopic,
  ]);

  // 에러 메시지 타이머
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (errorMessage) {
      timer = setTimeout(() => setErrorMessage(null), 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [errorMessage]);

  // 오류 처리 함수
  const handleError = useCallback(
    async (err: unknown, actionToRetry: () => Promise<void>) => {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("AI 응답 오류:", errorMsg);
      setError(errorMsg); // 전역 스토어 에러 업데이트

      if (retryCount < MAX_RETRY && autoProgressRef.current) {
        setRetryCount((prevCount) => prevCount + 1);
        const currentRetry = retryCount + 1; // 현재 재시도 횟수
        setErrorMessage(
          `응답 오류 (${currentRetry}/${MAX_RETRY}), 잠시 후 재시도합니다...`
        );
        // 오류 발생 시 로딩 상태 유지 및 재시도
        setIsLoading(true); // 로딩 상태를 명시적으로 true로 설정
        await new Promise((resolve) => setTimeout(resolve, 1500));
        actionToRetry(); // 전달받은 재시도 함수 호출
      } else {
        setErrorMessage(
          `오류 발생: ${errorMsg}${
            retryCount >= MAX_RETRY ? ` (최대 재시도 ${MAX_RETRY}회 도달)` : ""
          }`
        ); // 최종 에러 메시지 표시
        setIsLoading(false); // 로딩 중지
        setIsGeneratingFinalConclusion(false); // 최종 결론 생성 중지
        autoProgressRef.current = false; // 자동 진행 중지
        setRetryCount(0); // 재시도 카운트 리셋
      }
    },
    [
      retryCount,
      setError,
      setIsLoading,
      setIsGeneratingFinalConclusion,
      setErrorMessage,
    ]
  ); // autoProgressRef는 ref이므로 의존성 배열 불필요

  // 최종 결론 생성 (handleError에서 호출 가능하도록 분리)
  const generateFinalConclusion = useCallback(async () => {
    if (isLoading || isGeneratingFinalConclusion || finalConclusion) return;

    setIsGeneratingFinalConclusion(true);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      setRetryCount(0); // 성공적인 시도 전에 재시도 카운트 초기화
      const finalModel = conclusionSetting.finalModel;
      const prompt = createFinalConclusionPrompt(
        subject,
        conclusionSetting,
        conclusionRecord
      );
      const response = await AI(finalModel, prompt, "Conclusion", "");

      if (response.startsWith("[") && response.includes("오류")) {
        throw new Error(response);
      }

      setFinalConclusion(response);
      setIsConclusionFinished(true);
      autoProgressRef.current = false; // 성공 시 자동 진행 중지
      setIsLoading(false);
      setIsGeneratingFinalConclusion(false);
    } catch (err) {
      // handleError 호출 시 현재 함수(generateFinalConclusion)를 재시도 함수로 전달
      await handleError(err, generateFinalConclusion); // await 추가
    }
  }, [
    isLoading,
    isGeneratingFinalConclusion,
    finalConclusion,
    conclusionSetting,
    subject,
    conclusionRecord,
    setIsLoading,
    setErrorMessage,
    setFinalConclusion,
    setIsConclusionFinished,
    handleError, // handleError 추가
  ]);

  // AI 응답 처리 (handleError에서 호출 가능하도록 분리)
  const handleAIResponse = useCallback(async () => {
    // 조건 체크: 로딩중, 완료됨, 모델 없음, 대화 단계 초과 시 중단
    if (
      isLoading ||
      isConclusionFinished ||
      !currentModel ||
      conversationStage >= MAX_CONVERSATION_STAGES
    ) {
      // 만약 대화 단계 초과했는데 자동 진행 중이면 최종 결론 도출 시도
      if (
        conversationStage >= MAX_CONVERSATION_STAGES &&
        autoProgressRef.current &&
        !finalConclusion &&
        !isGeneratingFinalConclusion
      ) {
        await generateFinalConclusion(); // await 추가
      }
      return;
    }

    const model = currentModel;
    const roleName = getRoleName(model, conclusionSetting);
    const roleId = conclusionSetting.modelRoles[model] || "expert";

    setIsLoading(true);
    setErrorMessage(null); // 새 요청 시작 시 에러 메시지 초기화

    try {
      setRetryCount(0); // 성공적인 시도 전에 재시도 카운트 초기화

      const prompt = createConversationPrompt(
        conversationStage,
        subject,
        model,
        conclusionSetting,
        conclusionRecord,
        discussionTopic
      );

      const response = await AI(model, prompt, "Conclusion", roleId);

      if (response.startsWith("[") && response.includes("오류")) {
        throw new Error(response);
      }

      addConclusionRecord({
        model,
        role: roleName,
        perspective: roleId,
        content: response,
        stage: conversationStage,
      });

      const nextStep = currentStep + 1;
      if (nextStep >= conclusionSetting.models.length) {
        // 현재 스테이지 완료, 다음 스테이지 준비
        const nextStage = conversationStage + 1;
        setConversationStage(nextStage);
        setCurrentStep(0);
        if (conclusionSetting.models.length > 0) {
          setCurrentModel(conclusionSetting.models[0]);
        }
        // 다음 스테이지가 최종 결론 단계이고 자동 진행 중이면 최종 결론 생성 호출
        if (
          nextStage >= MAX_CONVERSATION_STAGES &&
          autoProgressRef.current &&
          !finalConclusion &&
          !isGeneratingFinalConclusion
        ) {
          await generateFinalConclusion(); // await 추가
        }
      } else {
        // 다음 모델 진행
        setCurrentStep(nextStep);
        setCurrentModel(conclusionSetting.models[nextStep]);
      }
      setIsLoading(false); // AI 응답 완료 후 로딩 해제
    } catch (err) {
      // handleError 호출 시 현재 함수(handleAIResponse)를 재시도 함수로 전달
      await handleError(err, handleAIResponse); // await 추가
    }
  }, [
    isLoading,
    isConclusionFinished,
    currentModel,
    conversationStage,
    conclusionSetting,
    subject,
    conclusionRecord,
    discussionTopic,
    currentStep,
    setIsLoading,
    setErrorMessage,
    addConclusionRecord,
    setConversationStage,
    setCurrentStep,
    setCurrentModel,
    handleError,
    finalConclusion,
    isGeneratingFinalConclusion,
    generateFinalConclusion, // generateFinalConclusion 의존성 추가
  ]);

  // 자동 진행 로직
  useEffect(() => {
    // 자동 진행 플래그가 false거나, 로딩 중이거나, 이미 완료되었으면 아무것도 안 함
    if (!autoProgressRef.current || isLoading || isConclusionFinished) return;

    let timeoutId: NodeJS.Timeout | null = null;

    // 즉시 실행 로직 (딜레이 없이 다음 액션 판단)
    const runAutoProgress = async () => {
      // 대화 단계 완료 체크
      const modelsInCurrentStage = conclusionRecord.filter(
        (record) => record.stage === conversationStage
      ).length;
      const allModelsSpokeInCurrentStage =
        modelsInCurrentStage >= conclusionSetting.models.length;

      if (conversationStage >= MAX_CONVERSATION_STAGES) {
        if (!finalConclusion && !isGeneratingFinalConclusion) {
          await generateFinalConclusion(); // await 추가
        }
      } else if (allModelsSpokeInCurrentStage) {
        // 모든 모델이 발언 완료했고, 다음 단계 시작 준비 완료 상태
        // handleAIResponse 내부에서 stage와 model을 업데이트하므로, 바로 호출
        await handleAIResponse(); // await 추가
      } else {
        // 현재 스테이지 진행 중, 다음 모델 응답 요청 (약간의 딜레이 후)
        timeoutId = setTimeout(async () => {
          // async 추가
          await handleAIResponse(); // await 추가
        }, 1000); // 1초 후 다음 응답 요청
      }
    };

    runAutoProgress(); // 자동 진행 로직 실행

    // 클린업 함수: 컴포넌트 언마운트 또는 의존성 변경 시 타이머 제거
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [
    // 자동 진행 로직이 반응해야 하는 상태들
    isLoading,
    isConclusionFinished,
    conversationStage,
    conclusionRecord, // 새 기록이 추가되면 다시 체크
    conclusionSetting.models.length,
    finalConclusion,
    isGeneratingFinalConclusion,
    handleAIResponse, // 실행할 함수
    generateFinalConclusion, // 실행할 함수
    // autoProgressRef.current 값의 변경은 useEffect를 트리거하지 않으므로 의존성 배열에 넣지 않음
    // 대신, 이 effect는 autoProgressRef.current가 true일 때만 실행됨
  ]);

  const startAutoProgress = useCallback(() => {
    if (!isConclusionFinished && !isLoading) {
      autoProgressRef.current = true;
      setErrorMessage(null); // 자동 진행 시작 시 에러 메시지 초기화
      // 자동 진행 시작 시 즉시 첫 액션 트리거 (useEffect가 처리하도록 변경)
      // 즉시 트리거를 원하면 여기서 handleAIResponse() 또는 generateFinalConclusion() 호출
      if (conversationStage >= MAX_CONVERSATION_STAGES) {
        if (!finalConclusion && !isGeneratingFinalConclusion) {
          generateFinalConclusion(); // 즉시 시작
        }
      } else {
        handleAIResponse(); // 즉시 시작
      }
    }
  }, [
    isConclusionFinished,
    isLoading,
    conversationStage,
    finalConclusion,
    isGeneratingFinalConclusion,
    generateFinalConclusion,
    handleAIResponse,
  ]);

  const stopAutoProgress = useCallback(() => {
    autoProgressRef.current = false;
  }, []);

  // 수동 진행 (자동 진행 중지 포함)
  const continueConversation = useCallback(async () => {
    // async 추가
    if (!isLoading) {
      autoProgressRef.current = false; // 수동 진행 시 자동 진행 중지
      setErrorMessage(null); // 수동 진행 시 에러 메시지 초기화
      if (conversationStage >= MAX_CONVERSATION_STAGES) {
        await generateFinalConclusion(); // await 추가
      } else {
        await handleAIResponse(); // await 추가
      }
    }
  }, [isLoading, conversationStage, generateFinalConclusion, handleAIResponse]);

  // 현재 진행 중인 모델의 역할 이름 가져오기 (로딩 표시용)
  const getCurrentRoleName = useCallback(() => {
    if (currentModel) {
      return getRoleName(currentModel, conclusionSetting);
    }
    return "전문가"; // 기본값
  }, [currentModel, conclusionSetting]);

  return {
    // State and Data
    subject,
    conclusionSetting,
    conclusionRecord,
    currentModel,
    isLoading,
    isConclusionFinished,
    finalConclusion,
    currentStep, // 디버깅 또는 특정 UI 표시에 필요할 수 있음
    conversationStage,
    isGeneratingFinalConclusion,
    errorMessage,
    autoProgressEnabled: autoProgressRef.current, // Ref 값을 상태처럼 반환

    // Handlers
    startAutoProgress,
    stopAutoProgress,
    continueConversation, // 수동 진행 및 재시도 버튼용 핸들러
    getCurrentRoleName, // 로딩 카드용 역할 이름
  };
};
